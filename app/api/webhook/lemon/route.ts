import { NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { addCredits } from "@/lib/storage";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: {
      event_name?: string;
      custom_data?: { user_id?: string };
    };
    data?: {
      attributes?: {
        variant_name?: string;
        first_order_item?: {
          variant_name?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "";
  const userId = payload.meta?.custom_data?.user_id;
  const variantName =
    payload.data?.attributes?.variant_name ??
    payload.data?.attributes?.first_order_item?.variant_name ??
    "";

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id in custom_data" }, { status: 400 });
  }

  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const match = variantName.match(/(\d+)\s*credit/i);
  const creditAmount = match ? parseInt(match[1], 10) : 100;

  try {
    await addCredits(userId, creditAmount);
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
