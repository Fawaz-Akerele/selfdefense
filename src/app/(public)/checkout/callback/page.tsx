"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PROVIDER_LABELS,
  type PaymentProviderName,
} from "@/lib/integrations/payments/types";

function CheckoutCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();

  const reference =
    params.get("reference") ??
    params.get("trxref") ??
    params.get("tx_ref") ??
    "";
  const provider = params.get("provider") as PaymentProviderName | null;
  const sessionId = params.get("session_id");
  const invalid = !reference || !provider;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    invalid ? "error" : "loading"
  );

  useEffect(() => {
    if (invalid) return;

    const qs = new URLSearchParams({ reference, provider: provider! });
    if (sessionId) qs.set("session_id", sessionId);

    fetch(`/api/checkout/verify?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => router.push("/portal?payment=success"), 2000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [invalid, reference, provider, sessionId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        {status === "loading" && (
          <>
            <p className="text-sm text-neutral-500">Verifying payment…</p>
            {provider && (
              <p className="mt-1 text-xs text-neutral-400">
                via {PROVIDER_LABELS[provider]}
              </p>
            )}
          </>
        )}
        {status === "success" && (
          <p className="text-lg font-medium text-green-700">Payment confirmed</p>
        )}
        {status === "error" && (
          <p className="text-lg font-medium text-red-600">
            Payment verification failed
          </p>
        )}
      </div>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
          Verifying payment…
        </div>
      }
    >
      <CheckoutCallbackContent />
    </Suspense>
  );
}
