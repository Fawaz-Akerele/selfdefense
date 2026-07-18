"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationSession } from "@/lib/services/locations";

type Props = {
  sessions: LocationSession[];
  selectedSessionId?: string;
  onSelectSession: (session: LocationSession) => void;
};

export function SessionCalendar({
  sessions,
  selectedSessionId,
  onSelectSession,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const sessionDates = useMemo(
    () => sessions.map((s) => new Date(s.startsAt)),
    [sessions]
  );

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPad = startOfMonth(currentMonth).getDay();

  function sessionsOnDay(day: Date) {
    return sessions.filter((s) => isSameDay(new Date(s.startsAt), day));
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-lg p-2 hover:bg-neutral-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-medium tracking-tight">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-lg p-2 hover:bg-neutral-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const daySessions = sessionsOnDay(day);
          const hasSession = daySessions.length > 0;
          const isSelected = daySessions.some(
            (s) => s.sessionId === selectedSessionId
          );

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!hasSession}
              onClick={() => {
                if (daySessions[0]) onSelectSession(daySessions[0]);
              }}
              className={cn(
                "relative flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                !isSameMonth(day, currentMonth) && "text-neutral-300",
                hasSession &&
                  "font-medium text-neutral-900 hover:bg-neutral-100",
                isSelected && "bg-neutral-900 text-white hover:bg-neutral-800",
                !hasSession && "cursor-default text-neutral-400"
              )}
            >
              {format(day, "d")}
              {hasSession && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-neutral-900" />
              )}
            </button>
          );
        })}
      </div>

      {sessionDates.length === 0 && (
        <p className="mt-4 text-center text-sm text-neutral-500">
          No upcoming sessions in selected locations.
        </p>
      )}
    </div>
  );
}
