"use client";

import { useState } from "react";
import { formatNgn } from "@/lib/utils";

type Props = {
  sessionId: string;
  classId: string;
  classTitle: string;
  priceNgn: number;
};

export function SessionBookButton({ sessionId, classId, classTitle, priceNgn }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function book() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/checkout/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountNgn: priceNgn,
        purpose: "class_booking",
        metadata: {
          session_id: sessionId,
          class_id: classId,
          class_title: classTitle,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Booking failed — sign in first");
      setLoading(false);
      return;
    }

    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={book}
        disabled={loading}
        className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Processing…" : `Book now · ${formatNgn(priceNgn)}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
