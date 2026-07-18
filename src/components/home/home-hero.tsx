import Image from "next/image";

export function HomeHero() {
  return (
    <section className="relative min-h-[min(100svh,920px)] w-full overflow-hidden">
      <Image
        src="/sydef-hero-fullscreen.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#f5f5eb] via-[#eef7f3]/95 to-transparent sm:max-w-[85%] lg:max-w-[58%]" />

      <div className="relative z-10 mx-auto flex min-h-[min(100svh,920px)] max-w-6xl items-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-800/70">
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
          <p className="mt-6 text-neutral-600 sm:text-lg">
            Browse in-person sessions by location. Add calendar reminders with
            directions sent to your phone.
          </p>
        </div>
      </div>
    </section>
  );
}
