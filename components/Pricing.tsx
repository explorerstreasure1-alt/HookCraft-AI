"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";

const packs = [
  { label: "25 Credits", price: "$1.99", credits: 25, highlight: false },
  { label: "100 Credits", price: "$4.99", credits: 100, highlight: true },
  { label: "500 Credits", price: "$14.99", credits: 500, highlight: false },
];

export default function Pricing() {
  const { user } = useAuth();
  const [anonId, setAnonId] = useState("");

  useEffect(() => {
    if (!user) {
      const match = document.cookie.match(/hc_uid=([^;]+)/);
      if (match) setAnonId(match[1]);
    }
  }, [user]);

  const userId = user?.id ?? anonId;
  const storeSlug = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE ?? "hookcraft";
  const v25 = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_25 ?? "";
  const v100 = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_100 ?? "";
  const v500 = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_500 ?? "";
  const variantIds = [v25, v100, v500];

  function checkoutUrl(variantId: string) {
    if (!variantId || !userId) return "#pricing";
    return `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}?checkout%5Bcustom%5D%5Buser_id%5D=${userId}&checkout%5Bembed%5D=0`;
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
            {user
              ? "Your credits are tied to your account. Access them from any device."
              : "Sign in to tie credits to your account. Otherwise credits stay on this browser only."}
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
              <a
                href={checkoutUrl(variantIds[i])}
                className={`mt-8 inline-flex w-full justify-center rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] transition ${
                  pack.highlight
                    ? "bg-[#d4af37] text-[#121214] hover:bg-[#f0d36b]"
                    : "border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#121214]"
                }`}
              >
                Buy {pack.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
