import Link from "next/link";
import { redirect } from "next/navigation";
import { SydefLogo } from "@/components/brand/sydef-logo";
import { PlanSelector } from "@/components/plans/plan-selector";
import { listPublicPlans } from "@/lib/services/plans";
import { createClient } from "@/lib/supabase/server";
import { shouldUseMockData } from "@/lib/mock";

const MOCK_PLANS = [
  {
    id: "plan-community",
    slug: "community-monthly",
    name: "Community Monthly",
    description: "2 in-person sessions + security alerts",
    billing_interval: "monthly",
    price_ngn: 15000,
    plan_entitlements: [
      { entitlement: "in_person_sessions_per_month", value_int: 2, value_bool: null },
      { entitlement: "security_alerts", value_int: null, value_bool: true },
    ],
  },
  {
    id: "plan-guardian",
    slug: "guardian-annual",
    name: "Guardian Annual",
    description: "Virtual library + priority scheduling + alerts",
    billing_interval: "annual",
    price_ngn: 120000,
    plan_entitlements: [
      { entitlement: "virtual_access", value_int: null, value_bool: true },
      { entitlement: "priority_scheduling", value_int: null, value_bool: true },
    ],
  },
];

export default async function PortalPlansPage() {
  if (shouldUseMockData()) {
    return <PlansShell plans={MOCK_PLANS} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/portal/plans");

  const plans = await listPublicPlans();
  return <PlansShell plans={plans as unknown as typeof MOCK_PLANS} />;
}

function PlansShell({ plans }: { plans: typeof MOCK_PLANS }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/portal">
            <SydefLogo size="sm" />
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/portal">Portal</Link>
            <Link href="/portal/preferences">Scheduling</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Choose your plan</h1>
        <p className="mt-2 text-neutral-600">
          Admin-configurable pricing — monthly, annual, or per session. Entitlements unlock features server-side.
        </p>
        <div className="mt-8">
          <PlanSelector plans={plans} />
        </div>
      </main>
    </div>
  );
}
