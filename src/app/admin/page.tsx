import Link from "next/link";
import { SydefLogo } from "@/components/brand/sydef-logo";
import { requireAdminAccess } from "@/lib/auth/require-admin";

export default async function AdminDashboardPage() {
  const { user, isSuperAdmin, capabilities } = await requireAdminAccess();

  const links = [
    { href: "/admin/clusters", label: "Demand clusters", cap: "scheduling" as const },
    { href: "/admin/plans", label: "Plans & entitlements", cap: "plans" as const },
    { href: "/admin/security-alerts", label: "Security alert queue", cap: "security" as const },
    { href: "/admin/content", label: "Content CMS", cap: "content" as const },
    { href: "/admin/analytics", label: "Analytics", cap: "analytics" as const },
    { href: "/admin/financial", label: "Financial Portal (P&L)", cap: "financial" as const },
    { href: "/admin/bookings", label: "Bookings", cap: "bookings" as const },
    { href: "/admin/corporate", label: "Corporate", cap: "corporate" as const },
    { href: "/admin/settings", label: "Platform Settings", cap: "settings" as const },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <Link href="/" className="inline-block hover:opacity-90">
              <SydefLogo size="sm" />
            </Link>
            <p className="mt-1 text-xs text-neutral-500">{user.email}</p>
          </div>
          {isSuperAdmin && (
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
              Super Admin
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Capabilities are granted by the super admin only.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {links.map((link) =>
            capabilities.has(link.cap) ? (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-400"
              >
                {link.label}
              </Link>
            ) : null
          )}
        </div>

        {isSuperAdmin && (
          <Link
            href="/admin/settings/superadmin"
            className="mt-8 inline-block text-sm text-neutral-600 underline"
          >
            Super admin settings →
          </Link>
        )}
      </main>
    </div>
  );
}
