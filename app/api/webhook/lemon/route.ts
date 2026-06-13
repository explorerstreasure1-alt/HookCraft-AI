import { NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { addCredits, addXp } from "@/lib/storage";
import { getAdmin } from "@/lib/supabase/admin";

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
        status?: string;
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

  // Handle subscription events
  if (eventName === "subscription_created" || eventName === "subscription_updated") {
    const status = payload.data?.attributes?.status;
    if (status === "active" || status === "resumed") {
      try {
        await handleSubscription(userId, productName);
        console.log("[webhook] subscription activated for", userId);
      } catch (err) {
        console.error("[webhook] subscription error:", err);
      }
    }
    return NextResponse.json({ received: true });
  }

  if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
    try {
      const admin = getAdmin();
      if (admin) {
        await admin.from("users").update({ plan: "free" }).eq("id", userId);
      }
      console.log("[webhook] subscription cancelled for", userId);
    } catch (err) {
      console.error("[webhook] cancel error:", err);
    }
    return NextResponse.json({ received: true });
  }

  // Handle one-time orders
  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  let creditAmount = 50;
  const total = payload.data?.attributes?.total ?? 0;
  
  // Credit packs (new pricing)
  if (total >= 2400) creditAmount = 1000;
  else if (total >= 900) creditAmount = 200;
  else if (total >= 400) creditAmount = 50;
  
  // Lifetime deal
  else if (total >= 9000) creditAmount = 999999;

  // Legacy pricing fallback
  else if (total >= 1400) creditAmount = 500;
  else if (total >= 400) creditAmount = 100;
  else if (total >= 150) creditAmount = 25;

  console.log("[webhook] adding", creditAmount, "credits to", userId, "(total:", total, "cents)");

  try {
    await addCredits(userId, creditAmount);
    
    // Add XP for purchase
    const xpAmount = Math.floor(creditAmount / 10);
    await addXp(userId, xpAmount);
    
    // Update plan if lifetime
    if (total >= 9000) {
      const admin = getAdmin();
      if (admin) {
        await admin.from("users").update({ plan: "lifetime" }).eq("id", userId);
      }
    }
    
    console.log("[webhook] SUCCESS");
  } catch (err) {
    console.error("[webhook] DB error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscription(userId: string, productName: string) {
  const admin = getAdmin();
  if (!admin) return;

  let plan = "creator";
  let credits = 50000;

  const lowerName = productName.toLowerCase();
  if (lowerName.includes("agency")) {
    plan = "agency";
    credits = 999999;
  } else if (lowerName.includes("pro")) {
    plan = "pro";
    credits = 999999;
  }

  await admin.from("users").update({ 
    plan, 
    credits,
    last_credit_reset: new Date().toISOString()
  }).eq("id", userId);
}