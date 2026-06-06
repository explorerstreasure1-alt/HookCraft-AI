import { NextResponse } from "next/server";
import { generateHooks } from "@/lib/mistral";
import { getCredits, decrementCredits } from "@/lib/storage";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
  }

  let body: { topic?: string; platform?: string; tone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { topic = "", platform = "TikTok", tone = "cinematic" } = body;

  if (!topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  if (!["cinematic", "contrarian", "urgent"].includes(tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }

  const credits = await getCredits(userId);

  if (credits <= 0) {
    return NextResponse.json({ error: "No credits remaining" }, { status: 402 });
  }

  try {
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
    console.error("Mistral API error:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}
