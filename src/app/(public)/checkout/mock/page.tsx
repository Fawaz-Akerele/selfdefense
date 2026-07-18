"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function MockCheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = params.get("reference") ?? "";
  const amount = params.get("amount") ?? "0";
  const [loading, setLoading] = useState(false);

  async function completePayment() {
    setLoading(true);
    const res = await fetch(
      `/api/checkout/verify?provider=mock&reference=${encodeURIComponent(reference)}`
    );
    const data = await res.json();
    if (data.success) {
      router.push("/portal?payment=success");
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
          Mock mode
        </p>
        <h1 className="mt-2 text-xl font-semibold">Simulate payment</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Reference: <code className="text-xs">{reference}</code>
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Amount: ₦{Number(amount).toLocaleString()}
        </p>
        <button
          type="button"
          onClick={completePayment}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Processing…" : "Complete mock payment"}
        </button>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
          Loading mock checkout…
        </div>
      }
    >
      <MockCheckoutContent />
    </Suspense>
  );
}
