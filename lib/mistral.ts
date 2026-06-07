import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY ?? "",
});

interface GenerateInput {
  topic: string;
  platform: string;
  tone: "cinematic" | "contrarian" | "urgent";
}

export async function generateHooks(input: GenerateInput): Promise<{
  hooks: string[];
  title: string;
  hashtags: string[];
}> {
  const systemPrompt = getSystemPrompt(input.tone);

  const userPrompt = `Write 3 scroll-stopping video hooks for an ${input.platform} video about: "${input.topic}".

Return this exact JSON (no markdown):
{
  "hooks": ["hook one max 25 words", "hook two max 25 words", "hook three max 25 words"],
  "title": "one catchy video title max 10 words",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}`;

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    maxTokens: 500,
    responseFormat: { type: "json_object" },
  });

  const raw = extractContent(response.choices?.[0]?.message?.content);
  try {
    return JSON.parse(raw);
  } catch {
    const lines = parseLines(raw, 10);
    return {
      hooks: lines.slice(0, 3),
      title: input.topic,
      hashtags: ["#fyp", "#viral", "#content", "#creator", `#${input.platform.toLowerCase().replace(/\s/g, "")}`],
    };
  }
}

export async function generateScript(input: GenerateInput): Promise<{
  hook: string;
  body: string;
  cta: string;
  title: string;
  hashtags: string[];
  description: string;
  sound: string;
}> {
  const toneGuide = getToneGuide(input.tone);

  const userPrompt = `Write a complete ${input.platform} video package about: "${input.topic}".

Return this exact JSON (no markdown, no explanation):
{
  "hook": "one gripping first sentence max 20 words",
  "title": "catchy video title max 10 words",
  "body": "main content script 4-6 sentences ~100 words. ${toneGuide}",
  "cta": "one strong call to action max 15 words",
  "description": "YouTube/Reels description 2-3 lines with emojis",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7"],
  "sound": "suggest a trending ${input.platform} sound or music vibe that fits this content e.g. 'upbeat lo-fi' or specific sound name"
}`;

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      { role: "system", content: getSystemPrompt(input.tone) },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 800,
    responseFormat: { type: "json_object" },
  });

  const raw = extractContent(response.choices?.[0]?.message?.content);
  try {
    return JSON.parse(raw);
  } catch {
    return {
      hook: "Ready to transform your content?",
      body: "Create engaging content that resonates with your audience. Stay consistent and authentic.",
      cta: "Follow for more insights.",
      title: input.topic,
      hashtags: ["#fyp", "#viral", "#content"],
      description: "Watch this video to learn more about " + input.topic,
      sound: "original sound - trending beat",
    };
  }
}

function getSystemPrompt(tone: string): string {
  const prompts: Record<string, string> = {
    cinematic:
      "You are a viral video script writer. Create cinematic, curiosity-driven hooks, titles, hashtags, and descriptions that maximize watch time and engagement on short-form platforms.",
    contrarian:
      "You are a contrarian content strategist. Create bold, opinion-flipping hooks, titles, hashtags, and descriptions that spark debate and comments.",
    urgent:
      "You are an urgency-driven copywriter. Create FOMO-inducing hooks, titles, hashtags, and descriptions that demand immediate attention.",
  };
  return prompts[tone] ?? prompts.cinematic;
}

function getToneGuide(tone: string): string {
  const guides: Record<string, string> = {
    cinematic: "Build tension gradually. Paint a visual scene. End with a reveal.",
    contrarian: "Challenge a common belief. Present the opposite view. Back it with a sharp insight.",
    urgent: "Start with a problem. Escalate the stakes. Offer the solution fast.",
  };
  return guides[tone] ?? guides.cinematic;
}

function extractContent(content: string | { type: string; text?: string }[] | null | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.map((chunk) => (chunk.type === "text" ? chunk.text : "")).join("");
}

function parseLines(text: string, max: number): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 5)
    .slice(0, max);
}
