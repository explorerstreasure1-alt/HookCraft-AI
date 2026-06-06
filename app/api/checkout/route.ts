import { NextResponse } from "next/server";

const storeSlug = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE ?? "projeai";
const variants = [
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_25 ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_100 ?? "",
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_500 ?? "",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idx = parseInt(searchParams.get("idx") ?? "0", 10);
  const userId = request.headers.get("x-user-id") ?? "";

  if (!userId) {
    return NextResponse.json({ url: "#pricing" });
  }

  const variantId = variants[idx];
  if (!variantId) {
    return NextResponse.json({ url: "#pricing" });
  }

  const url =
    `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}` +
    `?checkout%5Bcustom%5D%5Buser_id%5D=${encodeURIComponent(userId)}` +
    `&checkout%5Bembed%5D=0`;

  return NextResponse.json({ url });
}
