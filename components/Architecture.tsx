const steps = [
  { n: "01", icon: "\uD83D\uDC4D", t: "Drop your idea", d: "Upload a screenshot, paste a video, or just type what your video is about." },
  { n: "02", icon: "\uD83E\uDDE0", t: "AI writes your hooks", d: "Pick a style and platform. AI generates scroll-stopping hooks with virality scores." },
  { n: "03", icon: "\uD83D\uDCCB", t: "Copy, paste, record", d: "Grab the best hook, film your video. Full scripts, hashtags, and thumbnails included." },
  { n: "04", icon: "\uD83D\uDE80", t: "Go viral, repeat", d: "Use Key Scenes to find the best moments from longer videos. Keep creating." },
];

export default function Architecture() {
  return (
    <section id="architecture" className="bg-[#0a0a0f] px-6 py-24 sm:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.04),transparent_60%)]" />
      <div className="mx-auto max-w-7xl relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full text-xs font-medium text-[#d4af37] tracking-wide mb-4">
            How it works
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
            From idea to viral hook in seconds.
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            No complicated setup. No monthly fees. Just type your topic and let AI do the heavy lifting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="card p-6 group hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-4xl font-black text-zinc-800 group-hover:text-[#d4af37]/30 transition-colors">{s.n}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{s.t}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
