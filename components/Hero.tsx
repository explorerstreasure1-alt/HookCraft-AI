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
  const [bannerError, setBannerError] = useState(false);
  const [bgError, setBgError] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setH((p) => (p + 1) % hooks.length), 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function fetchStats(first: boolean) {
      const headers: Record<string, string> = {};
      if (first) headers["x-first-visit"] = "1";
      fetch("/api/stats", { headers })
        .then((r) => r.json())
        .then((d) => setStats(d))
        .catch(() => {});
    }
    const firstVisit = !sessionStorage.getItem("hc_visited");
    if (firstVisit) sessionStorage.setItem("hc_visited", "1");
    fetchStats(firstVisit);
    const i = setInterval(() => fetchStats(false), 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center bg-[#0a0a0f] overflow-hidden">
      {/* Deep background layers */}
      <div className="absolute inset-0">
        {!bgError && (
          <img
            src="/images/hookcraft-cinematic-studio.jpg"
            alt=""
            onError={() => setBgError(true)}
            className="w-full h-full object-cover scale-110 opacity-15"
            style={{ filter: "brightness(0.3) saturate(0.4)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]" />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#d4af37]/3 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#d4af37]/2 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(201,162,39,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.5) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Banner 2 - visible behind main content */}
      {!bannerError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-full max-w-4xl pointer-events-none">
          <img
            src="/images/banner-2.png"
            alt=""
            onError={() => setBannerError(true)}
            className="w-full h-auto object-contain opacity-35"
            style={{ filter: "brightness(0.6) saturate(1.2)" }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-32 sm:px-8 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-light px-4 py-1.5 rounded-full mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">AI-Powered Video Scripts</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[1.1] mb-8 animate-fade-up relative z-10">
            <span className="text-[#F5F0E8]">Your video&apos;s first </span>
            <span className="text-[#C9A227]">3 seconds</span>
            <span className="text-[#F5F0E8]">,</span>
            <br />
            <span className="text-[#8A8778] text-3xl sm:text-5xl lg:text-6xl mt-4 inline-block">
              written by AI.
            </span>
          </h1>

          {/* Platform icons */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 animate-fade-up relative z-10" style={{ animationDelay: "0.2s" }}>
            {[
              {
                name: "TikTok",
                svg: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
              },
              {
                name: "Shorts",
                svg: "M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z",
              },
              {
                name: "Reels",
                svg: "M12 2.982c2.937 0 3.285.011 4.445.064.846.039 1.306.18 1.612.311.405.156.694.344.998.649.304.304.492.593.648.998.131.306.272.766.311 1.612.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445c-.039.846-.18 1.306-.311 1.612-.156.405-.344.694-.649.998-.304.304-.593.492-.998.648-.306.131-.766.272-1.612.311-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064c-.846-.039-1.306-.18-1.612-.311-.405-.156-.694-.345-.999-.648-.304-.304-.492-.593-.648-.998-.131-.306-.272-.766-.311-1.612-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445c.039-.846.18-1.306.311-1.612.156-.405.344-.694.649-.999.304-.304.593-.492.998-.648.306-.131.766-.272 1.612-.311 1.16-.053 1.508-.064 4.445-.064zm0-2c-2.988 0-3.358.013-4.529.066-1.172.053-1.972.239-2.672.511-.733.285-1.354.665-1.973 1.285-.619.619-1 1.24-1.285 1.973-.272.7-.458 1.5-.511 2.672-.053 1.171-.066 1.541-.066 4.529s.013 3.358.066 4.529c.053 1.172.239 1.972.511 2.672.285.733.665 1.354 1.285 1.973.619.619 1.24 1 1.973 1.285.7.272 1.5.458 2.672.511 1.171.053 1.541.066 4.529.066s3.358-.013 4.529-.066c1.172-.053 1.972-.239 2.672-.511.733-.285 1.354-.665 1.973-1.285.619-.619 1-1.24 1.285-1.973.272-.7.458-1.5.511-2.672.053-1.171.066-1.541.066-4.529s-.013-3.358-.066-4.529c-.053-1.172-.239-1.972-.511-2.672-.285-.733-.665-1.354-1.285-1.973-.619-.619-1.24-1-1.973-1.285-.7-.272-1.5-.458-2.672-.511-1.171-.053-1.541-.066-4.529-.066zM9.265 7.11v9.811l8-4.905-8-4.906z",
              },
              {
                name: "LinkedIn",
                svg: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
              },
            ].map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 flex items-center justify-center group-hover:scale-110 group-hover:border-[#d4af37]/30 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d={p.svg} /></svg>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">{p.name}</span>
              </div>
            ))}
          </div>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 animate-fade-up leading-relaxed relative z-10"
            style={{ animationDelay: "0.15s" }}
          >
            Stop staring at a blank page. Drop a topic or screenshot — HookCraft AI generates
            scroll-stopping hooks, full scripts, hashtags, thumbnails. Copy, paste, record, go viral.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-12 animate-fade-up relative z-10" style={{ animationDelay: "0.3s" }}>
            <a href="#dashboard" className="gold-btn px-8 py-4 text-sm">
              Start Creating Free
            </a>
            <a
              href="#pricing"
              className="border border-[rgba(201,162,39,0.4)] text-[#C9A227] font-semibold px-8 py-4 text-sm uppercase tracking-wider hover:bg-[rgba(201,162,39,0.08)] hover:border-[rgba(201,162,39,0.6)] hover:shadow-[0_0_24px_rgba(201,162,39,0.1)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              style={{ borderRadius: "8px" }}
            >
              View Pricing
            </a>
          </div>

          {/* AI hook preview */}
          <div className="glass-light rounded-2xl p-6 max-w-xl mx-auto mb-12 animate-scale-in relative z-10" style={{ animationDelay: "0.4s" }}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-3">AI just wrote this</p>
            <p className="text-lg text-zinc-300 italic leading-relaxed transition-all duration-500" key={h}>
              &ldquo;{hooks[h]}&rdquo;
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up relative z-10" style={{ animationDelay: "0.5s" }}>
            {[
              { v: stats.active, l: "Online now" },
              { v: stats.visitors.toLocaleString(), l: "Visitors" },
              { v: stats.generated.toLocaleString(), l: "Hooks created" },
              { v: stats.scenes.toLocaleString(), l: "Scenes analyzed" },
            ].map((s) => (
              <div key={s.l} className="glass-light rounded-xl p-4 text-center hover:scale-[1.02] transition-transform duration-300">
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
