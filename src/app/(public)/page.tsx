import {
  getLocationsGroupedByState,
  getSessionsByLocations,
} from "@/lib/services/locations";
import { LocationFilterBrowser } from "@/components/locations/location-filter-browser";
import { dbCircuit } from "@/lib/recovery/circuit-breaker";
import { shouldUseMockData } from "@/lib/mock";

export default async function Home() {
  const { locationsByState, sessions } = shouldUseMockData()
    ? await (async () => {
        const locations = await getLocationsGroupedByState();
        const allIds = Object.values(locations).flat().map((l) => l.id);
        return { locationsByState: locations, sessions: await getSessionsByLocations(allIds) };
      })()
    : await dbCircuit.execute(
        async () => {
          const locations = await getLocationsGroupedByState();
          const allIds = Object.values(locations)
            .flat()
            .map((l) => l.id);
          return {
            locationsByState: locations,
            sessions: await getSessionsByLocations(allIds),
          };
        },
        async () => ({ locationsByState: {}, sessions: [] })
      );

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/sydef-hero-fullscreen.png)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fffef7]/95 via-[#ecfdf5]/80 to-transparent" aria-hidden />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-xl rounded-3xl bg-white/55 p-8 shadow-xl shadow-neutral-900/5 backdrop-blur-sm sm:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Psychology of Self Defence
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl sm:leading-tight lg:text-[2.65rem]">
              Danger doesn&apos;t knock.
              <br />
              <span className="text-neutral-600">It tests your readiness.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-800 sm:text-xl">
              From bandit raids and kidnapping to robbery, terrorism, and violence
              at work and at home—communities across the country are living under
              pressure. Survival can come down to decisions you make—in split seconds.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-neutral-700">
              Sydef connects you with security experts who train your psyche
              first—sharpening threat identification, evasion, and defence for
              your environment and yourself. Not fear. Not bravado. Preparedness…just in case.
            </p>
            <a
              href="/auth"
              className="mt-8 inline-block rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Start training
            </a>
            <a
              href="/portal/preferences"
              className="ml-3 mt-8 inline-block rounded-xl border border-neutral-900 px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Set your schedule preferences
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Find a session near you</h2>
          <p className="mt-2 text-neutral-600">
            Browse in-person sessions by location. Add calendar reminders with directions sent to your phone.
          </p>
        </section>

        <LocationFilterBrowser
          locationsByState={locationsByState}
          initialSessions={sessions}
        />
      </main>
    </div>
  );
}
