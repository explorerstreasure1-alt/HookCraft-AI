import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

export async function POST(request: Request) {
  let body: { image?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const base64 = body.image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await client.chat.complete({
      model: "pixtral-12b-latest",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this screenshot or image. Return JSON:\n{\n  \"summary\": \"one sentence describing what this is about\",\n  \"topic\": \"best hook topic for a viral short video about this content\",\n  \"hooks\": [\"hook 1\", \"hook 2\", \"hook 3\"]\n}" },
            { type: "image_url", imageUrl: `data:image/jpeg;base64,${base64}` },
          ],
        },
      ],
      temperature: 0.7,
      maxTokens: 500,
      responseFormat: { type: "json_object" },
    });

    const raw = response.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map(c => c.type === "text" ? c.text : "").join("") : "";

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ summary: text.slice(0, 200), topic: text.slice(0, 100), hooks: [] });
    }
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
