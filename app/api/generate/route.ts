import { NextResponse } from "next/server";
import { generateHooks, generateScript } from "@/lib/mistral";
import { getCredits, decrementCredits } from "@/lib/storage";

const cooldowns = new Map<string, number>();

const disposableDomains = [
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "throwaway.email", "yopmail.com", "sharklasers.com", "guerrillamail.info",
  "guerrillamail.biz", "guerrillamail.org", "guerrillamail.net", "guerrillamail.de",
  "trashmail.com", "mailnesia.com", "spam4.me", "temp-mail.org",
];

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `rate:${userId}`;
  const lastCall = cooldowns.get(rateKey) ?? 0;
  const now = Date.now();

  if (now - lastCall < 30_000) {
    const wait = Math.ceil((30_000 - (now - lastCall)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${wait}s before generating again.` },
      { status: 429 }
    );
  }

  let body: { topic?: string; platform?: string; tone?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { topic = "", platform = "TikTok", tone = "cinematic", mode = "hooks" } = body;

  if (!topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  if (topic.length > 500) {
    return NextResponse.json({ error: "Topic is too long (max 500 chars)." }, { status: 400 });
  }

  if (!["cinematic", "contrarian", "urgent"].includes(tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }

  let credits = 3;
  try {
    credits = await getCredits(userId);
  } catch (err) {
    console.error("[generate] getCredits error:", err);
  }

  if (credits <= 0) {
    return NextResponse.json({ error: "No credits remaining. Buy a pack below." }, { status: 402 });
  }

  cooldowns.set(rateKey, now);

  try {
    const isScript = mode === "script";

    if (isScript) {
      const script = await generateScript({
        topic: topic.trim(),
        platform,
        tone: tone as "cinematic" | "contrarian" | "urgent",
      });

      await decrementCredits(userId);
      const newCredits = await getCredits(userId);

      return NextResponse.json({ script, credits: newCredits, topic: topic.trim(), platform, mode: "script" });
    }

    const hooks = await generateHooks({
      topic: topic.trim(),
      platform,
      tone: tone as "cinematic" | "contrarian" | "urgent",
    });

    await decrementCredits(userId);

    const newCredits = await getCredits(userId);

    return NextResponse.json({
      hooks,
      credits: newCredits,
      topic: topic.trim(),
      platform,
    });
  } catch (err) {
    cooldowns.delete(rateKey);
    console.error("Mistral API error:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}
