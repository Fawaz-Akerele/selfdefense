"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { LocationSession } from "@/lib/services/locations";
import { SessionCalendar } from "@/components/calendar/session-calendar";
import { ReminderPicker } from "@/components/calendar/reminder-picker";
import { DirectionsMap } from "@/components/maps/directions-map";
import { SessionBookButton } from "@/components/booking/session-book-button";
import { formatNgn } from "@/lib/utils";

type Props = {
  sessions: LocationSession[];
};

export function LocationResultsPanel({ sessions }: Props) {
  const [selected, setSelected] = useState<LocationSession | null>(
    sessions[0] ?? null
  );

  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
        No in-person sessions found for your selected locations.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <SessionCalendar
          sessions={sessions}
          selectedSessionId={selected?.sessionId}
          onSelectSession={setSelected}
        />

        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.sessionId}
              type="button"
              onClick={() => setSelected(session)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                selected?.sessionId === session.sessionId
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <p className="text-sm font-medium">{session.classTitle}</p>
              <p className="text-xs text-neutral-500">
                {format(new Date(session.startsAt), "EEE, MMM d · h:mm a")} ·{" "}
                {session.location.city}, {session.location.state}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {session.seatsAvailable} seats left · {formatNgn(session.priceNgn)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <DirectionsMap directions={selected.directions} />
          <SessionBookButton
            sessionId={selected.sessionId}
            classId={selected.classId}
            classTitle={selected.classTitle}
            priceNgn={selected.priceNgn}
          />
          <ReminderPicker sessionId={selected.sessionId} />
        </div>
      )}
    </div>
  );
}
