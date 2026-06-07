const launchSteps = [
  {
    text: "Give every new creator 3 free credits, then each generation costs 1 credit.",
  },
  {
    text: "Sell credit packs as one-time purchases: $1.99 for 25, $4.99 for 100, $14.99 for 500.",
  },
  {
    text: "Use the product itself to publish three daily Shorts/Reels showing before-and-after hooks.",
  },
];

export default function ProductionLogic() {
  return (
    <section className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Serverless logic</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            The backend stays small: verify, generate, decrement, fulfill.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            AI, database, and payment secrets stay server-side. The client only receives hooks and credit counts.
          </p>
          <div className="mt-10 space-y-5">
            {launchSteps.map((step, index) => (
              <div key={step.text} className="border-t border-white/10 pt-5">
                <span className="font-mono text-sm text-[#d4af37]">{index + 1}</span>
                <p className="mt-2 text-lg leading-8 text-[#fdfbf7]/78">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-[#121214] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#d4af37]">api/generate route flow</p>
          <pre className="mt-5 overflow-x-auto text-xs leading-6 text-[#fdfbf7]/70">
{`POST /api/generate
1. Read { topic, platform, tone } from body
2. Get userId from x-user-id header (set by middleware)
3. Check credits from database
4. Reject with 402 when credits are empty
5. Send prompt to AI
6. Decrement one credit
7. Return { hooks, credits } to dashboard`}
          </pre>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#d4af37]">lemon webhook flow</p>
            <pre className="mt-5 overflow-x-auto text-xs leading-6 text-[#fdfbf7]/70">
{`POST /api/webhook/lemon
1. Read raw request body
2. Validate x-signature with HMAC SHA-256
3. order_created -> extract credit amount from variant name
4. credits += amount in database
5. Return { received: true }`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
