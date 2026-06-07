import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY ?? "",
});

interface GenerateInput {
  topic: string;
  platform: string;
  tone: "cinematic" | "contrarian" | "urgent";
}

export async function generateHooks(input: GenerateInput): Promise<string[]> {
  const systemPrompt = getSystemPrompt(input.tone);

  const userPrompt = `Write exactly 3 scroll-stopping video hooks for an ${input.platform} video about: "${input.topic}".

Rules:
- Each hook must be a single sentence (max 25 words).
- Every hook must be different from the others in angle or emotion.
- Do NOT use hashtags, emojis, or quotation marks around the hooks.
- Start each hook on a new line with just a number and dot (1. 2. 3.).
- Hooks must feel native to ${input.platform}.

Return ONLY the 3 numbered hooks, nothing else.`;

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    maxTokens: 300,
  });

  const raw = extractContent(response.choices?.[0]?.message?.content);
  return parseLines(raw, 3);
}

export async function generateScript(input: GenerateInput): Promise<{ hook: string; body: string; cta: string }> {
  const toneGuide = getToneGuide(input.tone);

  const userPrompt = `Write a complete ${input.platform} video script about: "${input.topic}".

Return exactly this JSON structure (no markdown, no explanation):
{
  "hook": "one gripping first sentence (max 20 words)",
  "body": "the main content script (4-6 sentences, ~100 words). ${toneGuide}",
  "cta": "one strong call to action (max 15 words)"
}`;

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      { role: "system", content: getSystemPrompt(input.tone) },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 500,
    responseFormat: { type: "json_object" },
  });

  const raw = extractContent(response.choices?.[0]?.message?.content);
  try {
    const parsed = JSON.parse(raw);
    return {
      hook: parsed.hook || "Ready to transform your content?",
      body: parsed.body || "Create engaging content that resonates with your audience.",
      cta: parsed.cta || "Follow for more tips.",
    };
  } catch {
    const lines = raw.split("\n").filter((l) => l.trim());
    return {
      hook: lines[0] || "Here is something you need to hear.",
      body: lines.slice(1, -1).join(" ") || "The key insight that changes everything.",
      cta: lines[lines.length - 1] || "Follow for more.",
    };
  }
}

function getSystemPrompt(tone: string): string {
  const prompts: Record<string, string> = {
    cinematic:
      "You are a cinematic video script writer. Generate hooks that create mystery, tension, and visual curiosity. Use sensory language, pause-worthy phrasing, and story-driven intrigue.",
    contrarian:
      "You are a contrarian content strategist. Generate hooks that challenge conventional wisdom, flip expectations, and make the viewer question what they know. Be bold and provocative.",
    urgent:
      "You are an urgency-driven copywriter. Generate hooks that create FOMO, time pressure, and immediate action. Make the viewer feel they will lose something if they scroll past.",
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
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 10)
    .slice(0, max);
}

