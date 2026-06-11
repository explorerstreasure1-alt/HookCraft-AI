import { NextResponse } from "next/server";
import { retentionAnalysis } from "@/lib/mistral";
import { withAuth, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "retention", 1);
  if (auth.error) return auth.error;

  let body: { script?: string; platform?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { script = "", platform = "TikTok" } = body;
  if (!script.trim()) return NextResponse.json({ error: "Script required" }, { status: 400 });

  try {
    const data = await retentionAnalysis({ script: script.trim(), platform });
    const spent = await consumeCredits(auth.userId, 1);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[retention] error:", err);
    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}
