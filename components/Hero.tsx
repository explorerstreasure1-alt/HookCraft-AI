"use client";

import { useEffect, useState } from "react";
import PremiumButton from "./PremiumButton";

const exampleHooks = [
  "This AI tool writes viral video hooks in seconds. Creators are sleeping on it.",
  "I stopped scripting my TikToks manually and my views tripled overnight.",
  "The first 3 seconds decide everything. Here is how AI gives you the right words.",
];

export default function Hero() {
  const [hookIdx, setHookIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setHookIdx((p) => (p + 1) % exampleHooks.length), 4000);
    return () => clearInterval(i);
  }, []);

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
            Stop staring at a blank page. Mistral AI writes scroll-stopping hooks and full scripts for TikTok, Shorts, Reels, and LinkedIn. Copy, paste, record.
          </p>

          <div className="mt-8 border border-[#d4af37]/20 bg-[#d4af37]/5 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 mb-3">AI-generated example</p>
            <p className="text-lg leading-8 text-[#fdfbf7]/80 motion-safe:animate-[riseIn_600ms_ease-out_both]" key={hookIdx}>
              "{exampleHooks[hookIdx]}"
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-7 text-sm text-[#fdfbf7]/40">
            <span>No credit card</span>
            <span>3 free hooks</span>
            <span>No subscription</span>
            <span>Pay as you go</span>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <PremiumButton href="#dashboard">Generate Hooks</PremiumButton>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#fdfbf7]/18 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#fdfbf7] transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
