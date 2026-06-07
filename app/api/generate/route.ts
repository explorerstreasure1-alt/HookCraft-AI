import { NextResponse } from "next/server";
import { generateHooks, generateScript, generateSeries, generateKeyMoments } from "@/lib/mistral";
import { getCredits, setCredits } from "@/lib/storage";

const cooldowns = new Map<string, number>();

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) return NextResponse.json({ error: "Missing user identity" }, { status: 400 });

  const rateKey = `rate:${userId}`;
  const now = Date.now();
  if (now - (cooldowns.get(rateKey) ?? 0) < 30_000) {
    return NextResponse.json({ error: "Wait before generating again." }, { status: 429 });
  }

  let body: { topic?: string; platform?: string; tone?: string; mode?: string; transcript?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { topic = "", platform = "TikTok", tone = "cinematic", mode = "hooks", transcript = "" } = body;
  if (!topic.trim() && !transcript) return NextResponse.json({ error: "Topic or transcript required" }, { status: 400 });
  if (topic.length > 500) return NextResponse.json({ error: "Topic too long" }, { status: 400 });

  let credits = 3;
  try { credits = await getCredits(userId); } catch { /* fallback */ }

  const cost = mode === "series" ? 3 : 1;
  if (credits < cost) return NextResponse.json({ error: `Need ${cost} credits. You have ${credits}.` }, { status: 402 });

  cooldowns.set(rateKey, now);

  try {
    const inp = { topic: topic.trim(), platform, tone: tone as "cinematic" | "contrarian" | "urgent" };

    let data: Record<string, unknown> = { hooks: [], title: topic.trim(), hashtags: [] };

    if (mode === "script") data = await generateScript(inp);
    else if (mode === "series") data = await generateSeries(inp);
    else if (mode === "moments") data = await generateKeyMoments(inp, transcript);
    else data = await generateHooks(inp);

    const newCredits = credits - cost;
    await setCredits(userId, newCredits);

    return NextResponse.json({ ...data, credits: newCredits, mode, topic: topic.trim(), platform });
  } catch (err) {
    cooldowns.delete(rateKey);
    console.error("[generate] error:", err);
    return NextResponse.json({ error: "AI generation failed." }, { status: 500 });
  }
}
