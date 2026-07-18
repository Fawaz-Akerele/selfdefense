import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type AdminCapability,
  getSuperAdminEmailFromDb,
  getUserAdminContext,
  userHasCapability,
  ADMIN_CAPABILITIES,
} from "@/lib/auth/admin-access";
import { isScreenshotMode } from "@/lib/auth/screenshot-mode";
import { MOCK_USER, MOCK_SUPER_ADMIN_EMAIL } from "@/lib/mock/data";

export async function requireAdminAccess(required?: AdminCapability) {
  if (isScreenshotMode()) {
    const supabase = await createClient();
    return {
      supabase,
      user: MOCK_USER,
      role: "super_admin" as const,
      isSuperAdmin: true,
      capabilities: new Set(ADMIN_CAPABILITIES),
      hasAdminAccess: true,
      superAdminEmail: MOCK_SUPER_ADMIN_EMAIL,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/admin");

  const superAdminEmail = await getSuperAdminEmailFromDb(supabase);
  const ctx = await getUserAdminContext(
    supabase,
    user.id,
    user.email,
    superAdminEmail
  );

  if (!ctx.hasAdminAccess) redirect("/portal");

  if (required && !userHasCapability(ctx.capabilities, ctx.isSuperAdmin, required)) {
    redirect("/admin");
  }

  return { supabase, user, ...ctx, superAdminEmail };
}
