export default function ProductionLogic() {
  return (
    <section className="bg-[#0a0a0f] px-6 py-24 sm:px-8 border-t border-zinc-800/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 glass-light rounded-full text-xs font-semibold text-[#d4af37] tracking-wide mb-4">
            Under the hood
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
            Small backend. Big results.
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            API keys and secrets stay server-side. The client only sees hooks and credit counts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto stagger">
          <div className="card p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                POST /api/generate
              </p>
            </div>
            <div className="space-y-2 text-sm text-zinc-400 font-mono">
              {[
                "Read topic, platform, tone from body",
                "Get user ID from middleware header",
                "Check credits from database",
                "Reject with 402 if empty",
                "Send prompt to AI",
                "Decrement one credit",
                "Return hooks + credits to dashboard",
              ].map((step, i) => (
                <p key={i} className="flex items-start gap-2">
                  <span className="text-[#d4af37]/40 text-xs shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{step}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="card p-6 group">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
              <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                POST /api/webhook/lemon
              </p>
            </div>
            <div className="space-y-2 text-sm text-zinc-400 font-mono">
              {[
                "Read raw request body",
                "Validate HMAC SHA-256 signature",
                "order_created event detected",
                "Extract credit amount from price",
                "Add credits to user account",
                "Return success confirmation",
              ].map((step, i) => (
                <p key={i} className="flex items-start gap-2">
                  <span className="text-[#d4af37]/40 text-xs shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{step}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
