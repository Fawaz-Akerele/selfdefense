"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectionsSnapshot } from "@/lib/services/directions";

type Props = {
  directions: DirectionsSnapshot;
  compact?: boolean;
};

export function DirectionsMap({ directions, compact = false }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
        aria-expanded={revealed}
      >
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
          <div>
            <p className="text-sm font-medium">{directions.venueName}</p>
            <p className="text-xs text-neutral-500">{directions.address}</p>
            {directions.landmark && (
              <p className="text-xs text-neutral-400">{directions.landmark}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            revealed && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          revealed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
            {!compact && directions.latitude && directions.longitude && (
              <div className="mb-3 overflow-hidden rounded-lg border border-neutral-100">
                <iframe
                  title={`Map to ${directions.venueName}`}
                  src={directions.mapEmbedUrl}
                  className="h-48 w-full sm:h-56"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            {directions.staticMapUrl && revealed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={directions.staticMapUrl}
                alt={`Map preview for ${directions.venueName}`}
                className="mb-3 hidden w-full rounded-lg border border-neutral-100 sm:block"
              />
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={directions.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
              >
                <Navigation className="h-4 w-4" />
                Open directions
              </a>
              <a
                href={directions.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
