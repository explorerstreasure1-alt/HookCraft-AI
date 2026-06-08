import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

interface GenInput {
  topic: string; platform: string; tone: "cinematic" | "contrarian" | "urgent";
}

const PROMPT_PREFIX = "Respond in the same language as the topic. Always return only valid JSON, no markdown wrapping.";

export async function generateHooks(input: GenInput): Promise<{
  hooks: { text: string; score: number }[];
  title: string;
  hashtags: string[];
  thumbnail: string;
}> {
  const sp = getSystemPrompt(input.tone);

  const prompt = `Topic: "${input.topic}" — Platform: ${input.platform}

Create 3 powerful, scroll-stopping hooks that HOOK the viewer in the first 3 seconds. Each hook must:
- Start with a bold pattern: a surprising statement, a counterintuitive claim, a personal revelation, or a direct question
- Create an information gap the viewer MUST close
- Be under 120 characters — punchy and tweetable
- Sound natural spoken aloud — use everyday language, not corporate
- Match the tone: ${getToneGuide(input.tone)}

Also write:
- A clickable, curiosity-driven title (under 60 chars)
- 5 relevant hashtags in the same language
- Bold thumbnail overlay text (3-5 words, ALL CAPS style)

${PROMPT_PREFIX}

Return this exact JSON structure:
{
  "hooks": [
    {"text": "hook text", "score": 85},
    {"text": "hook text", "score": 72},
    {"text": "hook text", "score": 91}
  ],
  "title": "title text",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
  "thumbnail": "THUMBNAIL TEXT"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: sp }, { role: "user", content: prompt }],
    temperature: 0.9, maxTokens: 800, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hooks: [{ text: raw.slice(0, 120), score: 50 }], title: input.topic, hashtags: ["#fyp"], thumbnail: "Watch This" };
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
  const sp = getSystemPrompt(input.tone);

  const prompt = `Topic: "${input.topic}" — Platform: ${input.platform}

Write a complete, ready-to-film video script package:

1. HOOK (1-2 sentences, under 120 chars): Open with impact. A bold claim, a question, or a surprising fact that stops the scroll.
2. TITLE (under 60 chars): Curiosity-driven, clickable.
3. BODY (4-6 punchy sentences): ${tg} Keep it tight — each sentence earns the next. Write for spoken delivery, not reading.
4. CTA (one short sentence, under 80 chars): Tell the viewer exactly what to do next.
5. DESCRIPTION (2-3 lines with emojis): Platform-optimized description for ${input.platform}.
6. HASHTAGS: 7 relevant hashtags.
7. SOUND: Suggest a trending sound or music vibe.
8. THUMBNAIL (3-5 words, bold style): Overlay text for the thumbnail.

${PROMPT_PREFIX}

Return this exact JSON structure:
{
  "hook": {"text": "hook text", "score": 85},
  "title": "title",
  "body": "body paragraph text",
  "cta": "call to action",
  "description": "description text",
  "hashtags": ["#t1","#t2","#t3","#t4","#t5","#t6","#t7"],
  "sound": "sound suggestion",
  "thumbnail": "THUMBNAIL TEXT"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: sp }, { role: "user", content: prompt }],
    temperature: 0.85, maxTokens: 1200, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hook: { text: "Watch this.", score: 50 }, body: "", cta: "Follow for more.", title: input.topic, hashtags: ["#fyp"], description: "", sound: "original", thumbnail: "Watch" };
  }
}

export async function generateSeries(input: GenInput): Promise<{
  hooks: { text: string; score: number }[];
  title: string;
  hashtags: string[];
  thumbnail: string;
}> {
  const sp = getSystemPrompt(input.tone);

  const prompt = `Topic: "${input.topic}" — Platform: ${input.platform}

Create a 10-part video CONTENT SERIES. Each episode needs its own scroll-stopping hook:
- Each hook under 120 characters, punchy and natural
- Every hook should explore a NEW angle or build on the previous
- Use a mix of: controversial takes, how-to promises, personal stories, surprising facts, challenges
- Make people binge-watch the entire series

Also write a series title (under 60 chars), 7 hashtags, and a series thumbnail text.

${PROMPT_PREFIX}

Return this exact JSON structure:
{
  "hooks": [
    {"text": "hook 1", "score": 90},
    {"text": "hook 2", "score": 85},
    {"text": "hook 3", "score": 88},
    {"text": "hook 4", "score": 82},
    {"text": "hook 5", "score": 91},
    {"text": "hook 6", "score": 79},
    {"text": "hook 7", "score": 86},
    {"text": "hook 8", "score": 83},
    {"text": "hook 9", "score": 87},
    {"text": "hook 10", "score": 80}
  ],
  "title": "series title",
  "hashtags": ["#t1","#t2","#t3","#t4","#t5","#t6","#t7"],
  "thumbnail": "THUMBNAIL TEXT"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: sp }, { role: "user", content: prompt }],
    temperature: 0.9, maxTokens: 2000, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hooks: [{ text: raw.slice(0, 120), score: 50 }], title: input.topic, hashtags: ["#fyp"], thumbnail: "Watch" };
  }
}

function getSystemPrompt(tone: string): string {
  const m: Record<string, string> = {
    cinematic: "You are a world-class viral video scriptwriter. You write hooks that feel like movie trailers — cinematic, emotional, visually evocative. Every line builds curiosity and demands a watch. You know the algorithms of TikTok, YouTube Shorts, and Instagram Reels intimately.",
    contrarian: "You are a bold, opinionated content strategist. You write hooks that challenge beliefs, flip narratives, and spark debate. Your hooks stop people mid-scroll by saying what nobody else will. You understand the psychology of engagement and algorithmic virality.",
    urgent: "You are an urgency-driven copywriter. You write FOMO-packed hooks that make people feel they'll MISS OUT if they don't watch. You create tension, raise stakes, and deliver. Every word is intentional and drives action.",
  };
  return m[tone] ?? m.cinematic;
}

function getToneGuide(tone: string): string {
  const m: Record<string, string> = {
    cinematic: "Paint a vivid scene. Create suspense. Build toward a reveal that makes the viewer NEED to see the ending.",
    contrarian: "State the popular belief. Then shatter it with evidence. Keep it sharp, provocative but truthful.",
    urgent: "Start with what's at stake. Escalate quickly. Show the consequence of not knowing this. Then deliver the insight.",
  };
  return m[tone] ?? m.cinematic;
}

function extract(c: string | { type: string; text?: string }[] | null | undefined): string {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c.map((x) => (x.type === "text" ? x.text : "")).join("");
}

export async function generateKeyMoments(input: GenInput, transcript: string): Promise<{
  moments: { title: string; timestamp: string; hook: { text: string; score: number } }[];
}> {
  const sp = getSystemPrompt(input.tone);
  const preview = transcript.slice(0, 4000);

  const prompt = `Video transcript: "${preview}"

Identify 3-5 most viral-worthy moments. For each: write the moment title, approximate timestamp, and one scroll-stopping hook (under 120 chars) for ${input.platform}.

${PROMPT_PREFIX}

Return JSON:
{
  "moments": [
    {"title": "moment title", "timestamp": "0:00", "hook": {"text": "hook text", "score": 85}},
    ...
  ]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "system", content: sp }, { role: "user", content: prompt }],
    temperature: 0.8, maxTokens: 1500, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { moments: [] };
  }
}
