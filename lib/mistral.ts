import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

interface GenInput {
  topic: string; platform: string; tone: "cinematic" | "contrarian" | "urgent";
}

export async function generateHooks(input: GenInput): Promise<{
  hooks: { text: string; score: number }[];
  title: string;
  hashtags: string[];
  thumbnail: string;
}> {
  const sp = getSystemPrompt(input.tone);

  const prompt = `Write 3 scroll-stopping hooks for ${input.platform}: "${input.topic}". Respond in the same language as the topic.

Return JSON:
{
  "hooks": [
    {"text": "hook max 25 words", "score": 85},
    {"text": "second hook", "score": 72},
    {"text": "third hook", "score": 91}
  ],
  "title": "catchy title max 10 words",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
  "thumbnail": "3-5 word bold text for thumbnail overlay"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: sp }, { role: "user", content: prompt }],
    temperature: 0.9, maxTokens: 600, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hooks: [{ text: raw.slice(0, 100), score: 50 }], title: input.topic, hashtags: ["#fyp"], thumbnail: "Watch This" };
  }
}

export async function generateScript(input: GenInput): Promise<{
  hook: { text: string; score: number };
  body: string;
  cta: string;
  title: string;
  hashtags: string[];
  description: string;
  sound: string;
  thumbnail: string;
}> {
  const tg = getToneGuide(input.tone);

  const prompt = `Write a complete ${input.platform} video package: "${input.topic}".

Return JSON:
{
  "hook": {"text": "one gripping opener max 20 words", "score": 80},
  "title": "catchy title max 10 words",
  "body": "4-6 sentences ~100 words. ${tg}",
  "cta": "one strong call to action max 15 words",
  "description": "YouTube/Reels description 2-3 lines with emojis",
  "hashtags": ["#t1","#t2","#t3","#t4","#t5","#t6","#t7"],
  "sound": "trending sound or music vibe suggestion",
  "thumbnail": "3-5 word bold thumbnail overlay text"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: getSystemPrompt(input.tone) }, { role: "user", content: prompt }],
    temperature: 0.8, maxTokens: 900, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hook: { text: "Watch this.", score: 50 }, body: "", cta: "Follow.", title: input.topic, hashtags: ["#fyp"], description: "", sound: "original", thumbnail: "Watch" };
  }
}

export async function generateSeries(input: GenInput): Promise<{
  hooks: { text: string; score: number }[];
  title: string;
  hashtags: string[];
  thumbnail: string;
}> {
  const sp = getSystemPrompt(input.tone);

  const prompt = `Write 10 scroll-stopping hooks for a ${input.platform} content SERIES about: "${input.topic}". Respond in the same language as the topic.

Each hook should build on the previous or explore a new angle. Return JSON:
{
  "hooks": [
    {"text": "hook 1 max 25 words", "score": 90},
    ...
  ],
  "title": "series title max 10 words",
  "hashtags": ["#t1","#t2","#t3","#t4","#t5","#t6","#t7"],
  "thumbnail": "3-5 word bold text for series trailer thumbnail"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: sp }, { role: "user", content: prompt }],
    temperature: 0.9, maxTokens: 1500, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hooks: [{ text: raw.slice(0, 100), score: 50 }], title: input.topic, hashtags: ["#fyp"], thumbnail: "Watch" };
  }
}

function getSystemPrompt(tone: string): string {
  const m: Record<string, string> = {
    cinematic: "You are a viral video script writer. Create cinematic, curiosity-driven hooks with virality scores, titles, hashtags, descriptions, and thumbnail text.",
    contrarian: "You are a contrarian strategist. Create bold, opinion-flipping hooks with virality scores, titles, hashtags, and thumbnail text that spark debate.",
    urgent: "You are an urgency copywriter. Create FOMO hooks with virality scores, titles, hashtags, and thumbnail text that demand attention.",
  };
  return m[tone] ?? m.cinematic;
}

function getToneGuide(tone: string): string {
  const m: Record<string, string> = {
    cinematic: "Build tension. Paint a visual scene. Reveal.",
    contrarian: "Challenge belief. Present opposite. Back it.",
    urgent: "State problem. Escalate stakes. Offer solution.",
  };
  return m[tone] ?? m.cinematic;
}

function extract(c: string | { type: string; text?: string }[] | null | undefined): string {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c.map((x) => (x.type === "text" ? x.text : "")).join("");
}
