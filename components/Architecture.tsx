const stackItems = [
  "Next.js 15 — Free hosting on Vercel",
  "Supabase — PostgreSQL database (free tier)",
  "Mistral AI — Hook & script generation",
  "Lemon Squeezy — One-time payments & webhooks",
];

const folders = [
  "app/page.tsx — Landing page",
  "app/auth/ — Google & email login",
  "app/api/generate/ — AI hook generation",
  "app/api/credits/ — Balance check",
  "app/api/webhook/lemon/ — Payment handler",
  "app/api/transcribe/ — Video to text",
  "app/api/analyze/ — Image analysis",
  "lib/mistral.ts — AI prompts",
  "lib/storage.ts — Supabase queries",
];

export default function Architecture() {
  return (
    <section id="architecture" className="bg-[#121214] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="motion-safe:animate-[fadeSlide_900ms_ease-out_both]">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">How it works</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Built for Vercel. Zero monthly cost. Pay only for what you use.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#fdfbf7]/68">
            Free hosting on Vercel. Credits stored in Supabase. AI hooks powered by Mistral. Payments via Lemon Squeezy. Everything talks to everything else through simple API routes.
          </p>
          <div className="mt-10 space-y-5">
            {stackItems.map((item, index) => (
              <div key={item} className="flex gap-4 border-t border-white/10 pt-5">
                <span className="font-mono text-sm text-[#d4af37]">0{index + 1}</span>
                <p className="text-lg text-[#fdfbf7]/86">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden border border-white/10 bg-[#1a2332]/74 p-6 shadow-2xl shadow-black/30 motion-safe:animate-[consoleGlow_5s_ease-in-out_infinite] sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#fdfbf7]/52">hookcraft-ai/architecture</span>
            <span className="h-2 w-2 rounded-full bg-[#d4af37] shadow-[0_0_28px_rgba(212,175,55,0.9)]" />
          </div>
          <div className="grid gap-3 font-mono text-sm text-[#fdfbf7]/74 sm:grid-cols-2">
            {folders.map((folder) => (
              <div key={folder} className="border-l border-[#d4af37]/35 pl-4">
                {folder}
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#d4af37]">Supabase users schema</p>
            <pre className="mt-4 overflow-x-auto text-xs leading-6 text-[#fdfbf7]/70">
{`users table
Each user gets:
• id (from Google/email auth)
• 3 free credits on signup
• Credits auto-refill after payment

No passwords. No subscriptions.`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
