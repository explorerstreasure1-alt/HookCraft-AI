import { NextResponse } from "next/server";
import { preflightCheck } from "@/lib/mistral";
import { withAuth, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "preflight", 1);
  if (auth.error) return auth.error;

  let body: { hook?: string; script?: string; platform?: string; hashtags?: string[]; thumbnail?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { hook = "", script = "", platform = "TikTok", hashtags = [], thumbnail = "" } = body;
  if (!hook.trim() && !script.trim()) return NextResponse.json({ error: "Hook or script required" }, { status: 400 });

  try {
    const data = await preflightCheck({ hook: hook.trim(), script: script.trim(), platform, hashtags, thumbnail: thumbnail.trim() });
    const spent = await consumeCredits(auth.userId, 1);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[preflight] error:", err);
    return NextResponse.json({ error: "Preflight check failed." }, { status: 500 });
  }
}
