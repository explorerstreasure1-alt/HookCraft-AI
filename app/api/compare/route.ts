import { NextResponse } from "next/server";
import { compareHooks } from "@/lib/mistral";
import { withAuth, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "compare", 1);
  if (auth.error) return auth.error;

  let body: { hooks?: string[]; platform?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { hooks = [], platform = "TikTok" } = body;
  if (hooks.length < 2 || hooks.length > 4) return NextResponse.json({ error: "Need 2-4 hooks" }, { status: 400 });
  if (hooks.some(h => h.length > 500)) return NextResponse.json({ error: "A hook is too long" }, { status: 400 });

  try {
    const data = await compareHooks({ hooks: hooks.map(h => h.trim()), platform });
    const spent = await consumeCredits(auth.userId, 1);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[compare] error:", err);
    return NextResponse.json({ error: "Comparison failed." }, { status: 500 });
  }
}
