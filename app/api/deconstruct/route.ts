import { NextResponse } from "next/server";
import { deconstructVideo, remixWithFormula, crossNicheRemix } from "@/lib/mistral";
import { withAuth, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "deconstruct", 1);
  if (auth.error) return auth.error;

  let body: {
    transcript?: string; scenes?: { start: number; end: number; title: string }[]; platform?: string;
    action?: string; topic?: string; tone?: string;
    formula_name?: string; formula_description?: string; segments?: { label: string; pattern: string; purpose: string }[];
    source_niche?: string; target_niche?: string;
  };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const action = body.action || "deconstruct";

  if (action === "remix") {
    const { topic = "", platform = "TikTok", tone = "cinematic", formula_name = "", formula_description = "", segments = [] } = body;
    if (!topic.trim()) return NextResponse.json({ error: "Topic required for remix" }, { status: 400 });
    if (!formula_name) return NextResponse.json({ error: "Formula required for remix" }, { status: 400 });
    try {
      const data = await remixWithFormula({ formula_name, formula_description, segments, topic: topic.trim(), platform, tone: tone as "cinematic" | "contrarian" | "urgent" });
      const spent = await consumeCredits(auth.userId, 1);
      if (spent.error) return spent.error;
      return NextResponse.json({ ...data, credits: spent.newCredits });
    } catch (err) { return NextResponse.json({ error: "Remix failed." }, { status: 500 }); }
  }

  if (action === "crossniche") {
    const { source_niche = "", target_niche = "", platform = "TikTok", tone = "cinematic", formula_name = "", formula_description = "", segments = [] } = body;
    if (!source_niche.trim() || !target_niche.trim()) return NextResponse.json({ error: "Source and target niches required" }, { status: 400 });
    if (!formula_name) return NextResponse.json({ error: "Formula required — deconstruct a video first" }, { status: 400 });
    try {
      const data = await crossNicheRemix({ source_niche: source_niche.trim(), target_niche: target_niche.trim(), formula_name, formula_description, segments, platform, tone: tone as "cinematic" | "contrarian" | "urgent" });
      const spent = await consumeCredits(auth.userId, 1);
      if (spent.error) return spent.error;
      return NextResponse.json({ ...data, credits: spent.newCredits });
    } catch (err) { return NextResponse.json({ error: "Cross-niche remix failed." }, { status: 500 }); }
  }

  const { transcript = "", scenes = [], platform = "TikTok" } = body;
  if (!transcript) return NextResponse.json({ error: "Transcript required" }, { status: 400 });
  try {
    const data = await deconstructVideo({ transcript, scenes, platform });
    const spent = await consumeCredits(auth.userId, 1);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[deconstruct] error:", err);
    return NextResponse.json({ error: "Deconstruction failed." }, { status: 500 });
  }
}
