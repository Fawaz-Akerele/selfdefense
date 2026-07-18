import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  shouldUseMockData,
  getMockCorporateOrdersForAdmin,
  getMockPackagesForAdmin,
} from "@/lib/mock";

export default async function AdminCorporatePage() {
  const { supabase } = await requireAdminAccess("corporate");

  const packages = shouldUseMockData()
    ? getMockPackagesForAdmin()
    : ((
        await supabase
          .from("corporate_packages")
          .select("id, name, staff_count, price_ngn, is_active")
          .order("sort_order", { ascending: true })
      ).data ?? []);

  const orders = shouldUseMockData()
    ? getMockCorporateOrdersForAdmin()
    : ((
        await supabase
          .from("corporate_orders")
          .select("id, company_name, status, staff_count, created_at")
          .order("created_at", { ascending: false })
          .limit(20)
      ).data ?? []);

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Corporate</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Packages and recent corporate orders for brand partners.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Packages</h2>
          <div className="mt-4 space-y-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl border bg-white p-4 text-sm">
                <p className="font-medium">{pkg.name}</p>
                <p className="mt-1 text-neutral-500">
                  {pkg.staff_count} staff · ₦{pkg.price_ngn.toLocaleString()} ·{" "}
                  {pkg.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Brand orders</h2>
          <div className="mt-4 space-y-2">
            {orders.length === 0 ? (
              <p className="text-sm text-neutral-500">No corporate orders yet.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{order.company_name ?? "Corporate order"}</p>
                  <p className="mt-1 capitalize text-neutral-500">
                    {order.status} · {order.staff_count} staff
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
