import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SecurityAlertQueue } from "@/components/admin/security-alert-queue";

export default async function AdminSecurityAlertsPage() {
  await requireAdminAccess("security");

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/admin" className="text-sm text-neutral-600">← Admin</Link>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Security alert queue</h1>
        <p className="mt-2 text-sm text-neutral-600">
          AI/cron ingests drafts here first. Approve before notifications reach subscribers with matching locations.
        </p>
        <div className="mt-8">
          <SecurityAlertQueue />
        </div>
      </main>
    </div>
  );
}
