import { NextResponse } from "next/server";
import { generateSalesFunnel } from "@/lib/mistral";
import { withAuth, consumeCredits } from "@/lib/route-helpers";

export async function POST(request: Request) {
  const auth = await withAuth(request, "funnel", 2);
  if (auth.error) return auth.error;

  let body: { product?: string; platform?: string; tone?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { product = "", platform = "TikTok", tone = "cinematic" } = body;
  if (!product.trim()) return NextResponse.json({ error: "Product name required" }, { status: 400 });

  try {
    const data = await generateSalesFunnel({ product: product.trim(), platform, tone: tone as "cinematic" | "contrarian" | "urgent" });
    const spent = await consumeCredits(auth.userId, 2);
    if (spent.error) return spent.error;
    return NextResponse.json({ ...data, credits: spent.newCredits });
  } catch (err) {
    console.error("[funnel] error:", err);
    return NextResponse.json({ error: "Funnel generation failed." }, { status: 500 });
  }
}
