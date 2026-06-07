import { NextResponse } from "next/server";

const storeSlug = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE ?? "projeai";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

const variants = [
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_25 ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_100 ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_500 ?? "",
];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const idx = parseInt(searchParams.get("idx") ?? "0", 10);
  const userId = request.headers.get("x-user-id") || "";
  const base = appUrl || origin;

  if (!userId) {
    return NextResponse.json({ url: "#pricing" });
  }

  const variantId = variants[idx];
  if (!variantId) {
    return NextResponse.json({ url: "#pricing" });
  }

  const successUrl = encodeURIComponent(`${base}/?checkout=success`);
  const url =
    `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}` +
    `?checkout%5Bcustom%5D%5Buser_id%5D=${encodeURIComponent(userId)}` +
    `&checkout%5Bembed%5D=0` +
    `&checkout%5Bsuccess_url%5D=${successUrl}`;

  return NextResponse.json({ url });
}
