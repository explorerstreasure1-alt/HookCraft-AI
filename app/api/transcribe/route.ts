import { NextResponse } from "next/server";

const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY ?? "";

export async function POST(request: Request) {
  let body: { audio?: string; type?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const formData = new FormData();
  const mimeType = body.type === "video" ? "audio/mp4" : body.type === "audio" ? "audio/mpeg" : "audio/wav";
  const blob = Buffer.from(body.audio, "base64");
  formData.append("file", new Blob([blob], { type: mimeType }), body.type === "video" ? "video.mp4" : "audio.mp3");
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "json");
  formData.append("language", "en");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[transcribe] Groq error:", data);
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const text: string = data.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "No speech detected" }, { status: 400 });
    }

    return NextResponse.json({ text, topic: `Video about: ${text.slice(0, 150)}` });
  } catch (err) {
    console.error("[transcribe] error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
