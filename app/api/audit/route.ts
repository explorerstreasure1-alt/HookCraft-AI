import { NextResponse } from "next/server";
import { auditHook } from "@/lib/mistral";
import { withAuth, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "audit", 1);
  if (auth.error) return auth.error;

  let body: { hook?: string; platform?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { hook = "", platform = "TikTok" } = body;
  if (!hook.trim() || hook.length > 500) return NextResponse.json({ error: "Hook text required (max 500 chars)" }, { status: 400 });

  try {
    const data = await auditHook({ hook: hook.trim(), platform });
    const spent = await consumeCredits(auth.userId, 1);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[audit] error:", err);
    return NextResponse.json({ error: "Audit failed." }, { status: 500 });
  }
}
