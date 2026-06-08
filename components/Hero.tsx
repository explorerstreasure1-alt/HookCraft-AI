"use client";

import { useEffect, useState } from "react";

const hooks = [
  "This AI tool writes viral hooks in seconds. Creators are sleeping on it.",
  "I stopped scripting manually and my views tripled overnight.",
  "The first 3 seconds decide everything. AI gives you the right words.",
];

export default function Hero() {
  const [h, setH] = useState(0);
  const [stats, setStats] = useState({ visitors: 0, generated: 0, scenes: 0, active: 0 });

  useEffect(() => {
    const i = setInterval(() => setH(p => (p + 1) % hooks.length), 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function fetchStats(first: boolean) {
      const headers: Record<string, string> = {};
      if (first) headers["x-first-visit"] = "1";
      fetch("/api/stats", { headers }).then(r => r.json()).then(d => setStats(d)).catch(() => {});
    }
    const firstVisit = !sessionStorage.getItem("hc_visited");
    if (firstVisit) sessionStorage.setItem("hc_visited", "1");
    fetchStats(firstVisit);
    const i = setInterval(() => fetchStats(false), 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center bg-[#0a0a0f] overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(37,37,54,0.4),transparent_50%)]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#252536]/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/images/hookcraft-cinematic-studio.jpg')] opacity-[0.03] bg-cover bg-center" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-32 sm:px-8 w-full">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
            <span className="text-xs font-medium text-[#d4af37] tracking-wide">AI-Powered Video Scripts</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.95] mb-6 animate-fade-up">
            <span className="text-white">Your video&apos;s first </span>
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f0d36b] to-[#c49b29] bg-clip-text text-transparent">3 seconds</span>
            <span className="text-white">, written by AI.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            Stop staring at a blank page. Drop a topic or screenshot — HookCraft AI generates scroll-stopping hooks, full scripts, hashtags, thumbnails. Copy, paste, record, go viral.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <a href="#dashboard" className="gold-shimmer text-[#0a0a0f] font-bold px-8 py-4 rounded-full text-sm uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_40px_rgba(212,175,55,0.25)]">
              Start Creating Free
            </a>
            <a href="#pricing" className="border border-zinc-700 text-zinc-300 font-semibold px-8 py-4 rounded-full text-sm uppercase tracking-wider hover:border-[#d4af37]/50 hover:text-[#d4af37] transition-all">
              View Pricing
            </a>
          </div>

          <div className="glass rounded-2xl p-6 max-w-xl mx-auto mb-12 animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">AI just wrote this</p>
            <p className="text-lg text-zinc-300 italic leading-relaxed" key={h}>
              &ldquo;{hooks[h]}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            {[
              { v: stats.active, l: "Online now", icon: "●", color: "text-green-400" },
              { v: stats.visitors.toLocaleString(), l: "Visitors", icon: "👥" },
              { v: stats.generated.toLocaleString(), l: "Hooks created", icon: "✨" },
              { v: stats.scenes.toLocaleString(), l: "Scenes analyzed", icon: "🎬" },
            ].map(s => (
              <div key={s.l} className="glass-light rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-white mb-1">{s.v}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
