import { NextResponse } from "next/server";
import { getCredits, decrementCredits } from "@/lib/storage";

const cooldowns = new Map<string, number>();

export function checkRateLimit(userId: string, prefix: string, ms = 30_000): NextResponse | null {
  const rateKey = `${prefix}:${userId}`;
  const now = Date.now();
  const lastCall = cooldowns.get(rateKey) ?? 0;
  if (now - lastCall < ms) {
    return NextResponse.json({ error: "Wait before trying again." }, { status: 429 });
  }
  cooldowns.set(rateKey, now);
  return null;
}

export function clearRateLimit(userId: string, prefix: string) {
  cooldowns.delete(`${prefix}:${userId}`);
}

export async function validateCredits(userId: string, cost: number): Promise<{ error?: NextResponse; credits?: number }> {
  let credits: number;
  try {
    credits = await getCredits(userId);
  } catch {
    return { error: NextResponse.json({ error: "Could not check credits" }, { status: 500 }) };
  }
  if (credits < cost) {
    return {
      error: NextResponse.json(
        { error: `Need ${cost} credit${cost > 1 ? "s" : ""}. You have ${credits}.` },
        { status: 402 }
      ),
    };
  }
  return { credits };
}

export async function consumeCredits(userId: string, cost: number): Promise<{ error?: NextResponse; newCredits?: number }> {
  try {
    const newCredits = await decrementCredits(userId, cost);
    return { newCredits };
  } catch (err) {
    console.error("[route-helpers] decrement error:", err);
    return { error: NextResponse.json({ error: "Failed to process credits" }, { status: 500 }) };
  }
}

export async function withAuth(request: Request, prefix: string, cost: number, cooldownMs = 30_000):
  Promise<{ userId: string; credits: number; error?: never } | { userId?: never; error: NextResponse }> {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) return { error: NextResponse.json({ error: "Missing user identity" }, { status: 400 }) };

  const rateError = checkRateLimit(userId, prefix, cooldownMs);
  if (rateError) return { error: rateError };

  const creditCheck = await validateCredits(userId, cost);
  if (creditCheck.error) {
    clearRateLimit(userId, prefix);
    return { error: creditCheck.error };
  }

  return { userId, credits: creditCheck.credits! };
}
