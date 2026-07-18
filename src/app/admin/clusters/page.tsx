import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { ClusterManager } from "@/components/admin/cluster-manager";

export default async function AdminClustersPage() {
  await requireAdminAccess("scheduling");

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/admin" className="text-sm text-neutral-600">← Admin</Link>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Demand clusters</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Preference-first scheduling — confirm clusters when member count meets threshold.
        </p>
        <div className="mt-8">
          <ClusterManager />
        </div>
      </main>
    </div>
  );
}
