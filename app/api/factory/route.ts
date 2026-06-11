import { NextResponse } from "next/server";
import { generateAllPlatforms, generateVariations, generateCalendar } from "@/lib/mistral";
import { withAuth, validateCredits, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "factory", 1);
  if (auth.error) return auth.error;

  let body: { action?: string; topic?: string; platform?: string; tone?: string; niche?: string; days?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const action = body.action || "platforms";
  const tone = (body.tone || "cinematic") as "cinematic" | "contrarian" | "urgent";
  const platform = body.platform || "TikTok";

  if (action === "calendar") {
    const niche = body.niche || "";
    if (!niche.trim()) return NextResponse.json({ error: "Niche required" }, { status: 400 });
    const days = Math.min(Math.max(body.days || 7, 3), 30);
    const credCheck = await validateCredits(auth.userId, 2);
    if (credCheck.error) return credCheck.error;
    try {
      const data = await generateCalendar({ niche: niche.trim(), platform, days, tone });
      const spent = await consumeCredits(auth.userId, 2);
      if (spent.error) return spent.error;
      return NextResponse.json({ ...data, credits: spent.newCredits });
    } catch (err) { return NextResponse.json({ error: "Calendar generation failed." }, { status: 500 }); }
  }

  const topic = body.topic || "";
  if (!topic.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  try {
    if (action === "platforms") {
      const data = await generateAllPlatforms({ topic: topic.trim(), tone });
      const spent = await consumeCredits(auth.userId, 1);
      if (spent.error) return spent.error;
      return NextResponse.json({ ...data, credits: spent.newCredits });
    }
    if (action === "variations") {
      const data = await generateVariations({ topic: topic.trim(), platform, tone });
      const spent = await consumeCredits(auth.userId, 1);
      if (spent.error) return spent.error;
      return NextResponse.json({ ...data, credits: spent.newCredits });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[factory] error:", err);
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}
