import { NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { addCredits } from "@/lib/storage";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  console.log("[webhook] signature present:", !!signature);
  console.log("[webhook] secret present:", !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET);

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    console.log("[webhook] signature verification FAILED");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: {
      attributes?: {
        total?: number;
        variant_name?: string;
        first_order_item?: { variant_name?: string; product_name?: string };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[webhook] event:", payload.meta?.event_name);
  console.log("[webhook] userId:", payload.meta?.custom_data?.user_id);
  console.log("[webhook] product:", payload.data?.attributes?.first_order_item?.product_name);

  const eventName = payload.meta?.event_name ?? "";
  const userId = payload.meta?.custom_data?.user_id;
  const productName = payload.data?.attributes?.first_order_item?.product_name ?? "";
  const variantName =
    payload.data?.attributes?.variant_name ??
    payload.data?.attributes?.first_order_item?.variant_name ??
    "";

  console.log("[webhook] variant:", variantName);

  if (!userId) {
    console.log("[webhook] no userId in custom_data");
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  let creditAmount = 25;
  const total = payload.data?.attributes?.total ?? 0;
  if (total >= 1400) creditAmount = 500;
  else if (total >= 400) creditAmount = 100;

  console.log("[webhook] adding", creditAmount, "credits to", userId, "(total:", total, "cents)");

  try {
    await addCredits(userId, creditAmount);
    console.log("[webhook] SUCCESS");
  } catch (err) {
    console.error("[webhook] DB error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
