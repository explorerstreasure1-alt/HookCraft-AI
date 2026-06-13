import { NextResponse } from "next/server";

const storeSlug = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE ?? "projeai";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

const creditVariants = [
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_50 ?? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_25 ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_200 ?? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_100 ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_1000 ?? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_500 ?? "",
];

const subscriptionVariants = [
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_SUB_CREATOR ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_SUB_PRO ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_SUB_AGENCY ?? "",
];

const lifetimeVariants = [
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_LIFETIME ?? "",
];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const type = searchParams.get("type") ?? "credit";
  const idx = parseInt(searchParams.get("idx") ?? "0", 10);
  const userId = request.headers.get("x-user-id") || "";
  const base = appUrl || origin;

  if (!userId) {
    return NextResponse.json({ url: "#pricing" });
  }

  let variantId = "";
  let isSubscription = false;

  if (type === "credit") {
    variantId = creditVariants[idx];
  } else if (type === "subscription") {
    variantId = subscriptionVariants[idx];
    isSubscription = true;
  } else if (type === "lifetime") {
    variantId = lifetimeVariants[idx];
  }

  if (!variantId) {
    return NextResponse.json({ url: "#pricing" });
  }

  const successUrl = encodeURIComponent(`${base}/?checkout=success`);
  
  let url = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}` +
    `?checkout%5Bcustom%5D%5Buser_id%5D=${encodeURIComponent(userId)}` +
    `&checkout%5Bembed%5D=0` +
    `&checkout%5Bsuccess_url%5D=${successUrl}`;

  if (isSubscription) {
    url += `&checkout%5Bdiscount_enabled%5D=1`;
  }

  return NextResponse.json({ url });
}