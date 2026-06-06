import PremiumButton from "./PremiumButton";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#121214] pt-20 text-[#fdfbf7]"
    >
      <div className="absolute inset-0">
        <img
          src="/images/hookcraft-cinematic-studio.jpg"
          alt="Cinematic video editing workstation for AI assisted short-form scripts"
          className="h-full w-full scale-105 object-cover motion-safe:animate-[slowZoom_18s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#121214_0%,rgba(18,18,20,0.88)_35%,rgba(18,18,20,0.38)_72%,rgba(18,18,20,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_72%,rgba(212,175,55,0.16),transparent_28%),radial-gradient(circle_at_82%_24%,rgba(26,35,50,0.52),transparent_32%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-3xl motion-safe:animate-[riseIn_900ms_ease-out_both]">
          <p className="mb-5 text-lg font-semibold uppercase tracking-[0.48em] text-[#d4af37] sm:text-xl">
            HookCraft AI
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-[#fdfbf7] sm:text-7xl lg:text-8xl">
            Build the first three seconds before you film.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-[#fdfbf7]/74 sm:text-lg">
            A Vercel-native AI video hook and script architect for creators who need scroll-stopping openings,
            structured scripts, and credit-based monetization from day one.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <PremiumButton href="#dashboard">Generate Hooks</PremiumButton>
            <a
              href="#architecture"
              className="inline-flex items-center justify-center rounded-full border border-[#fdfbf7]/18 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#fdfbf7] transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              View Blueprint
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
