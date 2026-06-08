const steps = [
  { n: "01", t: "Drop your idea", d: "Upload a screenshot, paste a video, or just type what your video is about." },
  { n: "02", t: "AI writes your hooks", d: "Pick a style and platform. AI generates scroll-stopping hooks with virality scores." },
  { n: "03", t: "Copy, paste, record", d: "Grab the best hook, film your video. Full scripts, hashtags, and thumbnails included." },
  { n: "04", t: "Go viral, repeat", d: "Use Key Scenes to find the best moments from longer videos. Keep creating." },
];

export default function Architecture() {
  return (
    <section id="architecture" className="bg-[#0A0A0A] px-6 py-24 sm:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,39,0.04),transparent_60%)]" />
      <div className="mx-auto max-w-7xl relative">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-up">
          <span className="label-mono inline-block mb-4">How it works</span>
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.03em] text-[#F5F0E8]">
            From idea to viral hook in seconds.
          </h2>
          <p className="mt-4 text-[#8A8778] text-lg">
            No complicated setup. No monthly fees. Just type your topic and let AI do the heavy lifting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 stagger">
          {steps.map((s) => (
            <div key={s.n} className="card p-6">
              <span className="font-display text-5xl font-black text-[#1E1E18] group-hover:text-[rgba(201,162,39,0.08)] transition-colors">{s.n}</span>
              <h3 className="font-sans text-lg font-bold text-[#F5F0E8] mt-3 mb-2">{s.t}</h3>
              <p className="text-sm text-[#8A8778] leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
