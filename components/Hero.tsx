"use client";

import { useEffect, useState } from "react";
import PremiumButton from "./PremiumButton";

const exampleHooks = [
  "This AI tool writes viral video hooks in seconds. Creators are sleeping on it.",
  "I stopped scripting my TikToks manually and my views tripled overnight.",
  "The first 3 seconds decide everything. Here is how AI gives you the right words.",
];

const stats = [
  { value: "10K+", label: "Hooks Generated" },
  { value: "4.9", label: "Creator Rating" },
  { value: "3s", label: "Avg Generation" },
];

export default function Hero() {
  const [hookIdx, setHookIdx] = useState(0);
  const [stats, setStats] = useState({ visitors: 0, generated: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

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
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl font-bold text-[#d4af37]">{'\u272F'}</span>
            <span className="text-lg font-semibold uppercase tracking-[0.4em] text-[#d4af37] sm:text-xl">HookCraft<span className="text-sm align-super text-[#fdfbf7]/50"> AI.</span></span>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-[11px] font-semibold text-[#d4af37]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-pulse" />
              AI-Powered
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fdfbf7]/30">Trusted by 2,000+ creators</span>
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-[#fdfbf7] sm:text-7xl lg:text-8xl">
            Your video's first 3 seconds, written by AI.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-[#fdfbf7]/74 sm:text-lg">
            Stop staring at a blank page. HookCraft AI generates scroll-stopping hooks and full scripts for TikTok, YouTube Shorts, Instagram Reels, and LinkedIn. Copy, paste, go viral.
          </p>

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            {[
              { icon: "🎵", name: "TikTok" },
              { icon: "▶️", name: "Shorts" },
              { icon: "📸", name: "Reels" },
              { icon: "💼", name: "LinkedIn" },
            ].map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1.5 text-xs text-[#fdfbf7]/50">
                {p.icon} {p.name}
              </span>
            ))}
          </div>

          <div className="mt-8 border border-[#d4af37]/20 bg-[#d4af37]/5 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60">AI just wrote this</span>
              <span className="h-px flex-1 bg-[#d4af37]/20" />
            </div>
            <p className="text-lg leading-8 text-[#fdfbf7]/80 motion-safe:animate-[riseIn_600ms_ease-out_both]" key={hookIdx}>
              &ldquo;{exampleHooks[hookIdx]}&rdquo;
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <PremiumButton href="#dashboard">Start Creating Free</PremiumButton>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#fdfbf7]/18 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#fdfbf7] transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              View Pricing
            </a>
          </div>

          <div className="mt-12 flex gap-8 flex-wrap">
            <div>
              <p className="text-3xl font-bold text-[#d4af37]">{stats.visitors.toLocaleString()}</p>
              <p className="text-xs text-[#fdfbf7]/30 mt-1">Visitors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#d4af37]">{stats.generated.toLocaleString()}</p>
              <p className="text-xs text-[#fdfbf7]/30 mt-1">Hooks Generated</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
