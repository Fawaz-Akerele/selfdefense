"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CLUSTER_STATUS_LABELS } from "@/lib/constants/scheduling";

type Cluster = {
  id: string;
  status: string;
  member_count: number;
  min_size: number;
  modality: string;
  locations?: { city?: string; state?: string; venue_name?: string };
  classes?: { title?: string };
};

export function ClusterManager() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/clusters")
      .then((r) => r.json())
      .then((d) => setClusters(d.clusters ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function confirm(clusterId: string) {
    if (!startsAt || !endsAt) {
      setMessage("Set start and end times");
      return;
    }
    setConfirming(clusterId);
    setMessage("");
    const res = await fetch("/api/admin/clusters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clusterId, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed");
      setConfirming(null);
      return;
    }
    setMessage(`Session created: ${data.sessionId}`);
    setConfirming(null);
    const refreshed = await fetch("/api/admin/clusters").then((r) => r.json());
    setClusters(refreshed.clusters ?? []);
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading clusters…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <p className="text-sm font-medium">Confirm a cluster → creates class session + notifies members</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="datetime-local" className="rounded-lg border px-3 py-2 text-sm" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          <input type="datetime-local" className="rounded-lg border px-3 py-2 text-sm" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
      </div>

      <div className="space-y-3">
        {clusters.map((c) => (
          <div key={c.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{c.classes?.title ?? "Open class"} · {c.locations?.city}</p>
                <p className="text-sm text-neutral-600">
                  {CLUSTER_STATUS_LABELS[c.status] ?? c.status} · {c.member_count}/{c.min_size} · {c.modality}
                </p>
              </div>
              {["forming", "ready"].includes(c.status) && (
                <button
                  type="button"
                  onClick={() => confirm(c.id)}
                  disabled={confirming === c.id}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {confirming === c.id ? "Confirming…" : "Confirm & schedule"}
                </button>
              )}
              {c.status === "confirmed" && (
                <span className="text-xs text-emerald-700">Confirmed</span>
              )}
            </div>
          </div>
        ))}
        {clusters.length === 0 && <p className="text-sm text-neutral-500">No clusters yet.</p>}
      </div>
    </div>
  );
}
