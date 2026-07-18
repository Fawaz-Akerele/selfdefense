import { randomInt } from "crypto";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { getMockPlatformSettings, shouldUseMockData } from "@/lib/mock";

export type VerificationPurpose =
  | "superadmin_login"
  | "password_change"
  | "superadmin_transfer";

const mockVerificationCodes = new Map<
  string,
  { code: string; purpose: VerificationPurpose; expiresAt: number }
>();

function mockCodeKey(email: string, purpose: VerificationPurpose) {
  return `${email.toLowerCase()}:${purpose}`;
}

export async function sendVerificationCode(
  email: string,
  purpose: VerificationPurpose,
  metadata: Record<string, string> = {}
) {
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const admin = tryCreateAdminClient();
  if (!admin) {
    mockVerificationCodes.set(mockCodeKey(email, purpose), {
      code,
      purpose,
      expiresAt: Date.now() + 15 * 60_000,
    });
    console.info(`[Sydef email mock] To: ${email} | Code: ${code} | Purpose: ${purpose}`);
    return { sent: true, mockCode: code };
  }
  const subject =
    purpose === "superadmin_transfer"
      ? "Sydef — Super Admin transfer code"
      : purpose === "password_change"
        ? "Sydef — Password change verification"
        : "Sydef — Verification code";

  const body = `Your Sydef verification code is: ${code}\n\nExpires in 15 minutes.`;

  await (admin.from("email_verification_codes") as ReturnType<typeof admin.from>).insert({
    email: email.toLowerCase(),
    code,
    purpose,
    expires_at: expiresAt,
    metadata,
  } as Record<string, unknown>);

  await (admin.from("email_logs") as ReturnType<typeof admin.from>).insert({
    to_email: email.toLowerCase(),
    subject,
    body,
    status: process.env.RESEND_API_KEY ? "queued" : "mock_sent",
  } as Record<string, unknown>);

  // Staging: always log code for mock/testing (remove in production or gate with MOCK_MODE)
  if (process.env.NODE_ENV !== "production" || process.env.PLATFORM_MODE === "mock") {
    console.info(`[Sydef email mock] To: ${email} | Code: ${code} | Purpose: ${purpose}`);
  }

  return { sent: true, mockCode: process.env.NODE_ENV !== "production" ? code : undefined };
}

export async function verifyCode(
  email: string,
  code: string,
  purpose: VerificationPurpose
) {
  const admin = tryCreateAdminClient();
  if (!admin) {
    const entry = mockVerificationCodes.get(mockCodeKey(email, purpose));
    if (!entry || entry.code !== code || entry.expiresAt < Date.now()) return false;
    mockVerificationCodes.delete(mockCodeKey(email, purpose));
    return true;
  }

  const { data, error } = await admin
    .from("email_verification_codes")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("code", code)
    .eq("purpose", purpose)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return false;

  const row = data as { id: string };
  await admin
    .from("email_verification_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);

  return true;
}

export async function getSuperAdminEmail() {
  if (shouldUseMockData()) {
    return getMockPlatformSettings().super_admin_email;
  }
  const admin = tryCreateAdminClient();
  if (!admin) return getMockPlatformSettings().super_admin_email;

  const { data } = await admin
    .from("platform_settings")
    .select("super_admin_email, primary_payment_provider, secondary_payment_provider, tertiary_payment_provider, mode")
    .limit(1)
    .single();

  const settings = data as { super_admin_email?: string } | null;
  return settings?.super_admin_email ?? "oadeagbo@gmail.com";
}

export async function transferSuperAdmin(
  currentEmail: string,
  newEmail: string,
  code: string
) {
  const valid = await verifyCode(currentEmail, code, "superadmin_transfer");
  if (!valid) throw new Error("Invalid or expired transfer code");

  const admin = tryCreateAdminClient();
  if (!admin) {
    return { success: true, newSuperAdmin: newEmail.toLowerCase() };
  }

  await admin
    .from("platform_settings")
    .update({ super_admin_email: newEmail.toLowerCase() })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  // Send code to new super admin for confirmation login
  await sendVerificationCode(newEmail, "superadmin_login", {
    transferred_from: currentEmail,
  });

  return { success: true, newSuperAdmin: newEmail.toLowerCase() };
}

export async function grantAdminCapability(
  granterId: string,
  targetUserId: string,
  capability: string
) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Database not configured");

  await (admin.from("admin_capability_grants") as ReturnType<typeof admin.from>).upsert(
    {
      user_id: targetUserId,
      capability,
      granted_by: granterId,
    } as Record<string, unknown>,
    { onConflict: "user_id,capability" }
  );

  await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", targetUserId);

  return { success: true };
}
