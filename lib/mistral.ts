import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY ?? "",
});

interface GenerateHooksInput {
  topic: string;
  platform: string;
  tone: "cinematic" | "contrarian" | "urgent";
}

const TONE_PROMPTS: Record<string, string> = {
  cinematic:
    "You are a cinematic video script writer. Generate hooks that create mystery, tension, and visual curiosity. Use sensory language, pause-worthy phrasing, and story-driven intrigue.",
  contrarian:
    "You are a contrarian content strategist. Generate hooks that challenge conventional wisdom, flip expectations, and make the viewer question what they know. Be bold and provocative.",
  urgent:
    "You are an urgency-driven copywriter. Generate hooks that create FOMO (fear of missing out), time pressure, and immediate action. Make the viewer feel they will lose something if they scroll past.",
};

export async function generateHooks(input: GenerateHooksInput): Promise<string[]> {
  const systemPrompt = TONE_PROMPTS[input.tone] ?? TONE_PROMPTS.cinematic;

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

  const content = response.choices?.[0]?.message?.content;
  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((chunk) => (chunk.type === "text" ? chunk.text : "")).join("")
        : "";

  const lines = raw
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 10);

  return lines.slice(0, 3);
}
