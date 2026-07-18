import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { shouldUseMockData } from "@/lib/mock";
import { MOCK_SUPER_ADMIN_EMAIL } from "@/lib/mock/data";

export type AdminCapability =
  | "content"
  | "analytics"
  | "financial"
  | "bookings"
  | "corporate"
  | "settings"
  | "scheduling"
  | "plans"
  | "security";

export const ADMIN_CAPABILITIES: AdminCapability[] = [
  "content",
  "analytics",
  "financial",
  "bookings",
  "corporate",
  "settings",
  "scheduling",
  "plans",
  "security",
];

export const SUPERADMIN_VERIFIED_COOKIE = "sydef_superadmin_verified";

const ROUTE_CAPABILITIES: Record<string, AdminCapability> = {
  "/admin/content": "content",
  "/admin/analytics": "analytics",
  "/admin/financial": "financial",
  "/admin/bookings": "bookings",
  "/admin/corporate": "corporate",
  "/admin/settings": "settings",
  "/admin/clusters": "scheduling",
  "/admin/plans": "plans",
  "/admin/security-alerts": "security",
};

export function getAdminLoginPath() {
  return process.env.ADMIN_LOGIN_PATH ?? "/admin/login";
}

export function isAdminLoginPath(pathname: string) {
  const loginPath = getAdminLoginPath();
  return pathname === loginPath || pathname === "/admin/login";
}

export function getRequiredCapability(pathname: string): AdminCapability | null {
  if (pathname.startsWith("/admin/settings/superadmin")) return null;
  for (const [prefix, capability] of Object.entries(ROUTE_CAPABILITIES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return capability;
    }
  }
  return null;
}

export async function getSuperAdminEmailFromDb(
  supabase: SupabaseClient<Database>
): Promise<string> {
  if (shouldUseMockData()) return MOCK_SUPER_ADMIN_EMAIL;

  const { data } = await supabase
    .from("platform_settings")
    .select("super_admin_email")
    .limit(1)
    .single();

  const row = data as { super_admin_email?: string } | null;
  return row?.super_admin_email ?? "oadeagbo@gmail.com";
}

export function isSuperAdminEmail(
  userEmail: string | undefined,
  superAdminEmail: string
) {
  return (
    Boolean(userEmail) &&
    userEmail!.toLowerCase() === superAdminEmail.toLowerCase()
  );
}

export async function getUserAdminContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail: string | undefined,
  superAdminEmail: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile as { role: string } | null)?.role;
  const isSuperAdmin =
    role === "super_admin" || isSuperAdminEmail(userEmail, superAdminEmail);

  const { data: grants } = await supabase
    .from("admin_capability_grants")
    .select("capability")
    .eq("user_id", userId);

  const capabilities = new Set<AdminCapability>(
    ((grants ?? []) as { capability: AdminCapability }[]).map((g) => g.capability)
  );

  if (isSuperAdmin) {
    ADMIN_CAPABILITIES.forEach((cap) => capabilities.add(cap));
  }

  const hasAdminAccess =
    isSuperAdmin ||
    role === "admin" ||
    capabilities.size > 0;

  return { role, isSuperAdmin, capabilities, hasAdminAccess };
}

export function userHasCapability(
  capabilities: Set<AdminCapability>,
  isSuperAdmin: boolean,
  capability: AdminCapability
) {
  return isSuperAdmin || capabilities.has(capability);
}
