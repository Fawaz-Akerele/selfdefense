"use client";

import { useState } from "react";
import { WEEKDAYS, TIME_BANDS, MODALITIES } from "@/lib/constants/scheduling";

type Location = { id: string; city: string; state: string; venue_name?: string | null };

type Props = {
  locations: Location[];
  classOptions?: { id: string; title: string }[];
};

export function PreferenceForm({ locations, classOptions = [] }: Props) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [classId, setClassId] = useState("");
  const [modality, setModality] = useState("in_person");
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [timeBand, setTimeBand] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const band = TIME_BANDS[timeBand];
    const res = await fetch("/api/scheduling/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId,
        classId: classId || null,
        modality,
        preferredDays: days,
        timeStart: band.start,
        timeEnd: band.end,
        notes: notes || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not save preferences");
      return;
    }

    setStatus("done");
    setMessage("You're in the demand pool. We'll notify you when enough members match your slot.");
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Tell us what works for you</h2>
        <p className="mt-1 text-sm text-neutral-600">
          No fixed dates yet — we cluster demand first, then schedule when numbers make sense.
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium">Preferred area</span>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          required
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.venue_name ?? l.city}, {l.state}
            </option>
          ))}
        </select>
      </label>

      {classOptions.length > 0 && (
        <label className="block text-sm">
          <span className="font-medium">Class focus (optional)</span>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Any suitable class</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset>
        <legend className="text-sm font-medium">Format</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODALITIES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setModality(m.value)}
              className={`rounded-full px-3 py-1 text-sm ${
                modality === m.value ? "bg-neutral-900 text-white" : "border"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={`rounded-full px-3 py-1 text-sm ${
                days.includes(d.value) ? "bg-emerald-700 text-white" : "border"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm">
        <span className="font-medium">Time window</span>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={timeBand}
          onChange={(e) => setTimeBand(Number(e.target.value))}
        >
          {TIME_BANDS.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="font-medium">Notes (optional)</span>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. prefer weekend mornings, gym near Allen Avenue"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading" || days.length === 0}
        className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "loading" ? "Saving…" : "Join demand pool"}
      </button>

      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-emerald-700"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
