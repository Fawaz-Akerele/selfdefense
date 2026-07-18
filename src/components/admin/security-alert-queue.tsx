"use client";

import { useEffect, useState } from "react";
import { ALERT_CATEGORIES, ALERT_SEVERITIES } from "@/lib/constants/scheduling";

type Draft = {
  id: string;
  title: string;
  summary: string;
  severity: string;
  category: string;
  source_name: string | null;
  created_at: string;
  locations?: { city?: string; state?: string };
};

export function SecurityAlertQueue() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin/security-alerts?status=pending_review");
    const data = await res.json();
    setDrafts(data.drafts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(draftId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/security-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, action, notes: notes[draftId] }),
    });
    if (res.ok) await load();
  }

  async function ingestDemo() {
    await fetch("/api/admin/security-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Elevated robbery reports — Ikeja axis",
        summary: "Multiple incidents reported near Allen Avenue in the last 48h. Avoid isolated ATMs after dark.",
        severity: "high",
        category: "robbery",
        sourceName: "Manual admin ingest",
      }),
    });
    await load();
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading queue…</p>;

  return (
    <div className="space-y-4">
      <button type="button" onClick={ingestDemo} className="rounded-lg border px-4 py-2 text-sm">
        + Add test draft (simulates AI ingest)
      </button>

      {drafts.map((d) => (
        <div key={d.id} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-neutral-500">
            <span>{d.severity}</span>
            <span>{d.category}</span>
            {d.locations && <span>{d.locations.city}, {d.locations.state}</span>}
          </div>
          <h3 className="mt-2 font-medium">{d.title}</h3>
          <p className="mt-1 text-sm text-neutral-700">{d.summary}</p>
          <p className="mt-1 text-xs text-neutral-400">Source: {d.source_name}</p>
          <textarea
            className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
            placeholder="Reviewer notes (optional)"
            value={notes[d.id] ?? ""}
            onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => review(d.id, "approve")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">
              Approve & notify matched users
            </button>
            <button type="button" onClick={() => review(d.id, "reject")} className="rounded-lg border px-4 py-2 text-sm">
              Reject
            </button>
          </div>
        </div>
      ))}

      {drafts.length === 0 && (
        <p className="text-sm text-neutral-500">No pending alerts — AI/cron ingest will populate this queue.</p>
      )}
    </div>
  );
}
