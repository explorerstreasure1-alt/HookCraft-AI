const stackItems = [
  "Next.js 15 App Router on Vercel Free Tier",
  "Supabase PostgreSQL for credit storage",
  "Mistral AI API route for hook generation",
  "Lemon Squeezy one-time checkout + webhook",
];

const folders = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/api/generate/route.ts",
  "app/api/credits/route.ts",
  "app/api/webhook/lemon/route.ts",
  "middleware.ts",
  "lib/mistral.ts",
  "lib/storage.ts",
  "lib/lemonsqueezy.ts",
];

export default function Architecture() {
  return (
    <section id="architecture" className="bg-[#121214] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="motion-safe:animate-[fadeSlide_900ms_ease-out_both]">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Zero-server-cost stack</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            A production blueprint that fits Vercel like a native product.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#fdfbf7]/68">
            Start free, keep the backend serverless, and move all durable state to Supabase. The AI generation route
            becomes a thin, auditable layer for credit checks, prompt control, and usage metering.
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
{`create table public.users (
  id text primary key,
  credits integer default 3,
  created_at timestamptz default now()
);

No auth required. Identity via httpOnly cookie.
Middleware sets x-user-id header automatically.
All payments are one-time credit top-ups.`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
