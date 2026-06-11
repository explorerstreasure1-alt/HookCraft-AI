import { NextResponse } from "next/server";
import { analyzeCreatorDNA, generateDNAOptimized } from "@/lib/mistral";
import { withAuth, validateCredits, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "dna", 3);
  if (auth.error) return auth.error;

  let body: {
    action?: string; videos?: { hook: string; platform: string; views: number; likes: number; comments: number; date?: string }[];
    niche?: string; topic?: string; platform?: string;
    dna_profile?: { label: string; value: string }[]; winning_patterns?: string[]; audience_traits?: string[];
  };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (body.action === "generate") {
    const { topic = "", platform = "TikTok", dna_profile = [], winning_patterns = [], audience_traits = [] } = body;
    if (!topic.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });
    if (!dna_profile.length) return NextResponse.json({ error: "Analyze your DNA first" }, { status: 400 });
    const credCheck = await validateCredits(auth.userId, 1);
    if (credCheck.error) return credCheck.error;
    try {
      const data = await generateDNAOptimized({ topic: topic.trim(), platform, dna_profile, winning_patterns, audience_traits });
      const spent = await consumeCredits(auth.userId, 1);
      if (spent.error) return spent.error;
      return NextResponse.json({ ...data, credits: spent.newCredits });
    } catch { return NextResponse.json({ error: "Generation failed." }, { status: 500 }); }
  }

  const { videos = [], niche = "" } = body;
  if (videos.length < 3) return NextResponse.json({ error: "Need at least 3 videos" }, { status: 400 });

  try {
    const data = await analyzeCreatorDNA({ videos, niche: niche.trim() });
    const spent = await consumeCredits(auth.userId, 3);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[dna] error:", err);
    return NextResponse.json({ error: "DNA analysis failed." }, { status: 500 });
  }
}
