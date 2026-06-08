export default function ProductionLogic() {
  return (
    <section className="bg-[#0a0a0f] px-6 py-24 sm:px-8 border-t border-zinc-800/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full text-xs font-medium text-[#d4af37] tracking-wide mb-4">
            Under the hood
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
            Small backend. Big results.
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">API keys and secrets stay server-side. The client only sees hooks and credit counts.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="card p-6">
            <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-4">POST /api/generate</p>
            <div className="space-y-2 text-sm text-zinc-400 font-mono">
              <p>1. Read topic, platform, tone from body</p>
              <p>2. Get user ID from middleware header</p>
              <p>3. Check credits from database</p>
              <p>4. Reject with 402 if empty</p>
              <p>5. Send prompt to AI</p>
              <p>6. Decrement one credit</p>
              <p>7. Return hooks + credits to dashboard</p>
            </div>
          </div>
          <div className="card p-6">
            <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-4">POST /api/webhook/lemon</p>
            <div className="space-y-2 text-sm text-zinc-400 font-mono">
              <p>1. Read raw request body</p>
              <p>2. Validate HMAC SHA-256 signature</p>
              <p>3. order_created event detected</p>
              <p>4. Extract credit amount from price</p>
              <p>5. Add credits to user account</p>
              <p>6. Return success confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
