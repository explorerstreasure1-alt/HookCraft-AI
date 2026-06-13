import { NextResponse } from "next/server";
import { applyReferralCode, getReferralStats } from "@/lib/storage";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) return NextResponse.json({ error: "Missing user identity" }, { status: 400 });

  try {
    const stats = await getReferralStats(userId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[referral] GET error:", err);
    return NextResponse.json({ error: "Failed to load referral stats" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) return NextResponse.json({ error: "Missing user identity" }, { status: 400 });

  try {
    const body = await request.json();
    const { code } = body as { code: string };

    if (!code || code.length < 4) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    const result = await applyReferralCode(userId, code.toUpperCase());
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid or already used referral code" }, { status: 400 });
    }

    return NextResponse.json({ success: true, bonus: result.bonus });
  } catch (err) {
    console.error("[referral] POST error:", err);
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 });
  }
}