"use client";

import { useState } from "react";

type Tab = "credits" | "subscription" | "lifetime";

const creditPacks = [
  { label: "50 Credits", price: "$4.99", credits: 50, perCredit: "$0.10", popular: false },
  { label: "200 Credits", price: "$9.99", credits: 200, perCredit: "$0.05", popular: true },
  { label: "1000 Credits", price: "$24.99", credits: 1000, perCredit: "$0.025", popular: false },
];

const subscriptions = [
  {
    name: "Creator",
    price: "$9.99",
    period: "/month",
    credits: "50,000",
    features: [
      "50,000 credits/month",
      "All AI tools access",
      "Priority generation",
      "Daily spin wheel",
      "Email support",
    ],
    popular: false,
    variantIdx: 0,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    credits: "Unlimited",
    features: [
      "Unlimited credits",
      "All AI tools + early access",
      "Fastest generation",
      "API access",
      "Custom brand voice",
      "Priority support",
    ],
    popular: true,
    variantIdx: 1,
  },
  {
    name: "Agency",
    price: "$49.99",
    period: "/month",
    credits: "Unlimited",
    features: [
      "Everything in Pro",
      "5 team members",
      "White-label option",
      "Bulk generation (100x)",
      "Dedicated account manager",
      "Custom integrations",
    ],
    popular: false,
    variantIdx: 2,
  },
];

export default function Pricing() {
  const [tab, setTab] = useState<Tab>("subscription");
  const [loadingIdx, setLoadingIdx] = useState<string | null>(null);

  async function goToCheckout(type: "credit" | "subscription" | "lifetime", idx: number) {
    const key = `${type}-${idx}`;
    setLoadingIdx(key);
    sessionStorage.setItem("hc_bought", "1");
    const res = await fetch(`/api/checkout?type=${type}&idx=${idx}`);
    const { url } = await res.json();
    if (url && !url.startsWith("#")) window.open(url, "_blank");
    setLoadingIdx(null);
  }

  return (
    <section id="pricing" className="bg-[#0a0a0f] px-6 py-24 sm:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent_60%)]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#d4af37]/2 rounded-full blur-[180px]" />

      <div className="mx-auto max-w-7xl relative">
        <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 glass-light rounded-full text-xs font-semibold text-[#d4af37] tracking-wide mb-4">
            Simple Pricing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
            Choose your plan.
            <br />
            <span className="text-[#d4af37]">Start creating viral content.</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Free tier available. Upgrade anytime. Cancel anytime.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[
            { id: "subscription" as Tab, label: "Monthly Plans", icon: "⭐" },
            { id: "credits" as Tab, label: "Credit Packs", icon: "💰" },
            { id: "lifetime" as Tab, label: "Lifetime Deal", icon: "🔥" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                tab === t.id
                  ? "bg-gradient-to-r from-[#d4af37] to-[#8b6914] text-[#0a0a0f] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  : "border border-zinc-800 text-zinc-400 hover:border-[#d4af37]/30 hover:text-white"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Subscription Plans */}
        {tab === "subscription" && (
          <div className="animate-fade-up">
            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {subscriptions.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`relative card p-8 group transition-all duration-300 ${
                    plan.popular
                      ? "ring-2 ring-[#d4af37]/50 shadow-[0_0_50px_rgba(212,175,55,0.15)] scale-[1.02]"
                      : "hover:shadow-[0_0_30px_rgba(212,175,55,0.08)]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#d4af37] to-[#f0d36b] text-[#0a0a0f] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-[0_0_16px_rgba(212,175,55,0.35)]">
                      Most Popular
                    </div>
                  )}

                  <div className={`absolute top-0 inset-x-0 h-px rounded-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent"
                      : "bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent opacity-0 group-hover:opacity-100"
                  } transition-opacity duration-500`} />

                  <p className="text-sm font-bold text-[#d4af37] uppercase tracking-wider">
                    {plan.name}
                  </p>

                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="font-display text-5xl font-black text-white tracking-[-0.04em]">
                      {plan.price}
                    </span>
                    <span className="text-sm text-zinc-500 pb-1">{plan.period}</span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4af37]/10 rounded-full">
                    <span className="text-xs font-bold text-[#d4af37]">{plan.credits} credits</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" className="shrink-0">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => goToCheckout("subscription", plan.variantIdx)}
                    disabled={loadingIdx !== null}
                    className={`mt-8 w-full rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                      plan.popular
                        ? "gold-shimmer text-[#0a0a0f]"
                        : "border border-zinc-700 text-zinc-300 hover:border-[#d4af37]/50 hover:text-[#d4af37] hover:bg-[#d4af37]/5"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {loadingIdx === `subscription-${plan.variantIdx}` ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      `Start ${plan.name}`
                    )}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-zinc-500 text-sm mt-8">
              All plans include 7-day free trial. Cancel anytime.
            </p>
          </div>
        )}

        {/* Credit Packs */}
        {tab === "credits" && (
          <div className="animate-fade-up">
            <div className="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto">
              {creditPacks.map((pack, i) => (
                <div
                  key={pack.label}
                  className={`relative card p-8 group transition-all duration-300 ${
                    pack.popular
                      ? "ring-1 ring-[#d4af37]/30 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
                      : "hover:shadow-[0_0_30px_rgba(212,175,55,0.06)]"
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#d4af37] to-[#f0d36b] text-[#0a0a0f] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-[0_0_16px_rgba(212,175,55,0.35)]">
                      Best Value
                    </div>
                  )}

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

                  <div className="mt-3 text-xs text-zinc-500">
                    {pack.perCredit} per credit
                  </div>

                  <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
                    {pack.credits} hook generations.
                    <br />
                    No expiry. No auto-renew.
                  </p>

                  <button
                    onClick={() => goToCheckout("credit", i)}
                    disabled={loadingIdx !== null}
                    className={`mt-8 w-full rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                      pack.popular
                        ? "gold-shimmer text-[#0a0a0f]"
                        : "border border-zinc-700 text-zinc-300 hover:border-[#d4af37]/50 hover:text-[#d4af37] hover:bg-[#d4af37]/5"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {loadingIdx === `credit-${i}` ? (
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

            <p className="text-center text-zinc-500 text-sm mt-8">
              Credits never expire. Use them anytime.
            </p>
          </div>
        )}

        {/* Lifetime Deal */}
        {tab === "lifetime" && (
          <div className="animate-fade-up max-w-2xl mx-auto">
            <div className="relative card p-10 text-center ring-2 ring-[#d4af37]/50 shadow-[0_0_60px_rgba(212,175,55,0.2)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
                Limited Time Offer
              </div>

              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />

              <p className="text-2xl font-black text-white mb-2">Lifetime Access</p>
              <p className="text-zinc-400 text-sm mb-6">Pay once. Use forever.</p>

              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-zinc-500 line-through text-2xl">$297</span>
                <span className="font-display text-6xl font-black text-[#d4af37] tracking-[-0.04em]">$97</span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
                <span className="text-red-400 text-sm font-bold">67% OFF - Only 100 spots left</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {[
                  "Unlimited credits for 6 months",
                  "All current & future AI tools",
                  "Priority generation queue",
                  "Lifetime community access",
                  "Early access to new features",
                  "No monthly fees. Ever.",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" className="shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => goToCheckout("lifetime", 0)}
                disabled={loadingIdx !== null}
                className="w-full gold-shimmer rounded-full px-8 py-5 text-base font-bold uppercase tracking-[0.2em] text-[#0a0a0f] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingIdx === "lifetime-0" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </span>
                ) : (
                  "Claim Lifetime Deal"
                )}
              </button>

              <p className="text-zinc-500 text-xs mt-4">
                Secure payment via LemonSqueezy. 30-day money-back guarantee.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Happy Users", value: "2,847+" },
                { label: "Hooks Created", value: "1.2M+" },
                { label: "Avg. Rating", value: "4.9/5" },
              ].map((s) => (
                <div key={s.label} className="glass-light rounded-xl p-4">
                  <p className="text-xl font-black text-[#d4af37]">{s.value}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Money-back guarantee */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 glass-light rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-sm text-zinc-300">
              <span className="text-[#d4af37] font-bold">30-day money-back guarantee.</span> No questions asked.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}