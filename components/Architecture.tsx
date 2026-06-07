const steps = [
  { num: "01", title: "Drop or type your idea", desc: "Upload a screenshot, paste a video link, or just type what your video is about." },
  { num: "02", title: "AI writes your hooks", desc: "Pick a style and platform. AI generates scroll-stopping hooks with virality scores." },
  { num: "03", title: "Copy, paste, record", desc: "Grab the best hook, film your video. Full scripts, hashtags, and thumbnails included." },
  { num: "04", title: "Go viral, repeat", desc: "Use Key Scenes to find the best moments from longer videos. Keep creating, keep growing." },
];

export default function Architecture() {
  return (
    <section id="architecture" className="bg-[#121214] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">How it works</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            From idea to viral hook in seconds.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            No complicated setup. No monthly fees. Just type your topic and let AI do the heavy lifting.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {steps.map((step) => (
            <div key={step.num} className="group border border-white/10 bg-[#121214] p-8 rounded-2xl transition hover:border-[#d4af37]/30 hover:bg-[#1a2332]/50">
              <span className="text-4xl font-bold text-[#d4af37]/20 group-hover:text-[#d4af37]/40 transition">{step.num}</span>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#fdfbf7]/55">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
