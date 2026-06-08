"use client";

import { useState } from "react";

const packs = [
  { label: "25 Credits", price: "$1.99", credits: 25, popular: false },
  { label: "100 Credits", price: "$4.99", credits: 100, popular: true },
  { label: "500 Credits", price: "$14.99", credits: 500, popular: false },
];

export default function Pricing() {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  async function goToCheckout(idx: number) {
    setLoadingIdx(idx);
    sessionStorage.setItem("hc_bought", "1");
    const res = await fetch(`/api/checkout?idx=${idx}`);
    const { url } = await res.json();
    if (url && !url.startsWith("#")) window.open(url, "_blank");
    setLoadingIdx(null);
  }

  return (
    <section id="pricing" className="bg-[#0a0a0f] px-6 py-24 sm:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent_60%)]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#d4af37]/2 rounded-full blur-[180px]" />

      <div className="mx-auto max-w-7xl relative">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 glass-light rounded-full text-xs font-semibold text-[#d4af37] tracking-wide mb-4">
            Pay as you go
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
            One payment. No subscription.
            <br />
            Credits never expire.
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Click any pack to checkout securely. Credits added automatically after payment.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto stagger">
          {packs.map((pack, i) => (
            <div
              key={pack.label}
              className={`relative card p-8 group transition-all duration-300 ${
                pack.popular
                  ? "ring-1 ring-[#d4af37]/30 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
                  : "hover:shadow-[0_0_30px_rgba(212,175,55,0.06)]"
              }`}
            >
              {/* Popular badge */}
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#d4af37] to-[#f0d36b] text-[#0a0a0f] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-[0_0_16px_rgba(212,175,55,0.35)]">
                  Most Popular
                </div>
              )}

              {/* Top glow */}
              <div className={`absolute top-0 inset-x-0 h-px rounded-full transition-opacity duration-500 ${
                pack.popular
                  ? "bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent opacity-100"
                  : "bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent opacity-0 group-hover:opacity-100"
              }`} />

              <p className="text-sm font-bold text-[#d4af37] uppercase tracking-wider">
                {pack.label}
              </p>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="font-display text-5xl font-black text-white tracking-[-0.04em]">
                  {pack.price}
                </span>
                <span className="text-sm text-zinc-500 pb-1">one-time</span>
              </div>

              <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
                {pack.credits} hook generations.
                <br />
                No expiry. No auto-renew.
              </p>

              <button
                onClick={() => goToCheckout(i)}
                disabled={loadingIdx !== null}
                className={`mt-8 w-full rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                  pack.popular
                    ? "gold-shimmer text-[#0a0a0f]"
                    : "border border-zinc-700 text-zinc-300 hover:border-[#d4af37]/50 hover:text-[#d4af37] hover:bg-[#d4af37]/5"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {loadingIdx === i ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </span>
                ) : (
                  `Buy ${pack.label}`
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
