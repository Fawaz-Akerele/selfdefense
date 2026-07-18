"use client";

import { useMemo, useState, useTransition } from "react";
import { LocationResultsPanel } from "@/components/locations/location-results-panel";
import type { LocationSession } from "@/lib/services/locations";

type Location = {
  id: string;
  state: string;
  city: string;
  venue_name: string | null;
};

type Props = {
  locationsByState: Record<string, Location[]>;
  initialSessions: LocationSession[];
};

export function LocationFilterBrowser({
  locationsByState,
  initialSessions,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState(initialSessions);
  const [isPending, startTransition] = useTransition();

  const states = useMemo(
    () => Object.keys(locationsByState).sort(),
    [locationsByState]
  );

  function toggleLocation(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function applyFilter() {
    startTransition(async () => {
      const params = new URLSearchParams();
      selectedIds.forEach((id) => params.append("locationId", id));
      const res = await fetch(`/api/locations/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions ?? []);
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-medium tracking-tight">
          Filter by location
        </h2>
        <div className="space-y-4">
          {states.map((state) => (
            <div key={state}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
                {state}
              </p>
              <div className="flex flex-wrap gap-2">
                {locationsByState[state].map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocation(loc.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      selectedIds.includes(loc.id)
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {loc.city}
                    {loc.venue_name ? ` · ${loc.venue_name.split("—")[0]?.trim()}` : ""}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={applyFilter}
          disabled={selectedIds.length === 0 || isPending}
          className="mt-4 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
        >
          {isPending ? "Loading…" : "Show sessions & calendar"}
        </button>
      </div>

      <LocationResultsPanel sessions={sessions} />
    </div>
  );
}
