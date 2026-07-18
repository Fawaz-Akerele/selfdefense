"use client";

import { useState } from "react";
import { formatNgn } from "@/lib/utils";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  billing_interval: string;
  price_ngn: number;
  plan_entitlements?: Array<{ entitlement: string; value_int: number | null; value_bool: boolean | null }>;
};

export function PlanSelector({ plans }: { plans: Plan[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function subscribe(plan: Plan) {
    setLoading(plan.id);
    setError("");

    const res = await fetch("/api/checkout/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountNgn: plan.price_ngn,
        purpose: "subscription_plan",
        metadata: { plan_id: plan.id, plan_slug: plan.slug },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Checkout failed");
      setLoading(null);
      return;
    }

    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-2xl border bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500">{plan.billing_interval}</p>
          <h3 className="mt-1 text-lg font-semibold">{plan.name}</h3>
          <p className="mt-2 text-2xl font-bold">{formatNgn(plan.price_ngn)}</p>
          {plan.description && <p className="mt-2 text-sm text-neutral-600">{plan.description}</p>}
          <ul className="mt-4 space-y-1 text-sm text-neutral-700">
            {(plan.plan_entitlements ?? []).map((e) => (
              <li key={e.entitlement}>• {e.entitlement.replace(/_/g, " ")}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => subscribe(plan)}
            disabled={loading === plan.id}
            className="mt-5 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading === plan.id ? "Redirecting…" : "Choose plan"}
          </button>
        </div>
      ))}
      {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}
    </div>
  );
}
