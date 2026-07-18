import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { listPublicPlans } from "@/lib/services/plans";
import { formatNgn } from "@/lib/utils";
import { shouldUseMockData } from "@/lib/mock";

export default async function AdminPlansPage() {
  await requireAdminAccess("plans");

  const plans = shouldUseMockData()
    ? []
    : await listPublicPlans();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/admin" className="text-sm text-neutral-600">← Admin</Link>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Pricing plans & entitlements</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Plans are seeded in migration 00005. Extend via Supabase or add admin CRUD API.
        </p>
        <div className="mt-8 space-y-4">
          {plans.map((p: Record<string, unknown>) => (
            <div key={String(p.id)} className="rounded-xl border bg-white p-4">
              <p className="font-medium">{String(p.name)}</p>
              <p className="text-sm text-neutral-600">
                {String(p.billing_interval)} · {formatNgn(Number(p.price_ngn))}
              </p>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-sm text-neutral-500">Run migration 00005 to seed default plans, or use mock mode.</p>
          )}
        </div>
      </main>
    </div>
  );
}
