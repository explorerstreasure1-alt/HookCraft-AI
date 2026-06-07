import { NextResponse } from "next/server";

const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

export async function POST(request: Request) {
  if (!MISTRAL_KEY) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  let body: { frames?: string[]; transcript?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { frames = [], transcript = "" } = body;

  if (frames.length === 0 && !transcript) {
    return NextResponse.json({ error: "No frames or transcript" }, { status: 400 });
  }

  const parts: Record<string, unknown>[] = [
    {
      type: "text",
      text: `Analyze these video frames. Find visual scene boundaries. Return JSON: {"scenes": [{"start": "MM:SS", "end": "MM:SS", "title": "scene", "visual_clue": "what changed", "hook": {"text": "viral hook", "score": 85}}]}${transcript ? " Context: " + transcript.slice(0, 500) : ""}`,
    },
  ];

  for (const frame of frames.slice(0, 8)) {
    parts.push({ type: "image_url", imageUrl: frame });
  }

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MISTRAL_KEY}` },
      body: JSON.stringify({
        model: "pixtral-12b-latest",
        messages: [{ role: "user", content: parts }],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    try { return NextResponse.json(JSON.parse(text)); }
    catch { return NextResponse.json({ scenes: [] }); }
  } catch (err) {
    console.error("[scenes] error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
