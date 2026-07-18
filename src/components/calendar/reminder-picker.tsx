"use client";

import { useState } from "react";
import { Bell, MapPin } from "lucide-react";
import { REMINDER_PRESETS, type ReminderChannel } from "@/lib/constants/reminders";
import { cn } from "@/lib/utils";

type Props = {
  sessionId: string;
  onScheduled?: () => void;
};

export function ReminderPicker({ sessionId, onScheduled }: Props) {
  const [minutesBefore, setMinutesBefore] = useState(60);
  const [channel, setChannel] = useState<ReminderChannel>("both");
  const [includeMap, setIncludeMap] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSchedule() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          minutesBefore,
          channel,
          includeDirectionsMap: includeMap,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule reminder");

      setMessage("Reminder set — you'll get directions with your alert.");
      onScheduled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-neutral-600" />
        <h4 className="text-sm font-medium">Set reminder</h4>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">When</label>
          <select
            value={minutesBefore}
            onChange={(e) => setMinutesBefore(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            {REMINDER_PRESETS.map((p) => (
              <option key={p.minutes} value={p.minutes}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-500">Notify via</label>
          <div className="flex gap-2">
            {(["in_app", "whatsapp", "both"] as ReminderChannel[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize",
                  channel === c
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600"
                )}
              >
                {c.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeMap}
            onChange={(e) => setIncludeMap(e.target.checked)}
            className="rounded border-neutral-300"
          />
          <MapPin className="h-3.5 w-3.5 text-neutral-500" />
          Include directions map in reminder
        </label>

        <button
          type="button"
          onClick={handleSchedule}
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Scheduling…" : "Schedule reminder"}
        </button>

        {message && <p className="text-xs text-green-700">{message}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
