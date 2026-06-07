"use client";

import { useState } from "react";

const packs = [
  { label: "25 Credits", price: "$1.99", credits: 25, highlight: false },
  { label: "100 Credits", price: "$4.99", credits: 100, highlight: true },
  { label: "500 Credits", price: "$14.99", credits: 500, highlight: false },
];

export default function Pricing() {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  async function goToCheckout(idx: number) {
    setLoadingIdx(idx);
    const res = await fetch(`/api/checkout?idx=${idx}`);
    const { url } = await res.json();
    if (url && !url.startsWith("#")) {
      window.open(url, "_blank");
    }
    setLoadingIdx(null);
  }

  return (
    <section id="pricing" className="bg-[#121214] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Pay-as-you-go</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            One payment, no subscription, credits never expire.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            Click any pack to checkout securely with Lemon Squeezy. Credits are added automatically after payment.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {packs.map((pack, i) => (
            <div
              key={pack.label}
              className={`border p-8 ${
                pack.highlight
                  ? "border-[#d4af37]/42 bg-[#1a2332]/72"
                  : "border-white/10 bg-[#0c0d10]"
              }`}
            >
              <p className="text-sm uppercase tracking-[0.24em] text-[#d4af37]">{pack.label}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-6xl font-semibold tracking-[-0.06em]">{pack.price}</span>
                <span className="pb-2 text-[#fdfbf7]/50">one-time</span>
              </div>
              <p className="mt-5 text-[#fdfbf7]/68">
                {pack.credits} hook generations. No expiry.
              </p>
              <button
                onClick={() => goToCheckout(i)}
                disabled={loadingIdx !== null}
                className={`mt-8 inline-flex w-full justify-center rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] transition ${
                  pack.highlight
                    ? "bg-[#d4af37] text-[#121214] hover:bg-[#f0d36b]"
                    : "border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#121214]"
                }`}
              >
                {loadingIdx === i ? "Redirecting..." : `Buy ${pack.label}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
