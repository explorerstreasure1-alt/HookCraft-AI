import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

export async function POST(request: Request) {
  let body: { frames?: string[]; transcript?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { frames = [], transcript = "" } = body;

  if (frames.length === 0 && !transcript) {
    return NextResponse.json({ error: "No frames or transcript provided" }, { status: 400 });
  }

  const parts: ({ type: "text"; text: string } | { type: "image_url"; imageUrl: string })[] = [
    {
      type: "text",
      text: `Analyze these ${frames.length} video frames. Find visual scene boundaries (location change, new person, camera switch). Return JSON:
{
  "scenes": [
    {"start": "MM:SS", "end": "MM:SS", "title": "scene name", "visual_clue": "what changed", "hook": {"text": "viral hook", "score": 85}}
  ]
}
${transcript ? `Transcript context: "${transcript.slice(0, 1000)}"` : ""}`,
    },
  ];

  for (const frame of frames.slice(0, 12)) {
    parts.push({ type: "image_url", imageUrl: frame });
  }

  try {
    const response = await client.chat.complete({
      model: "pixtral-12b-latest",
      messages: [{ role: "user", content: parts }],
      temperature: 0.5,
      maxTokens: 2000,
      responseFormat: { type: "json_object" },
    });

    const raw = response.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map(c => (c as { type: string; text?: string }).type === "text" ? (c as { text: string }).text : "").join("") : "";

    try { return NextResponse.json(JSON.parse(text)); }
    catch { return NextResponse.json({ scenes: [] }); }
  } catch (err) {
    console.error("[scenes] error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
