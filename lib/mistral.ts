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

export async function auditHook(input: { hook: string; platform: string }): Promise<{
  pattern: string;
  breakdown: { dimension: string; score: number; note: string }[];
  strengths: string[];
  weaknesses: string[];
  improvements: { text: string; score: number }[];
  platform_fit: { platform: string; score: number; reason: string }[];
}> {
  const prompt = `Analyze this video hook for ${input.platform}:
"${input.hook}"

Return a deep content audit as JSON:
{
  "pattern": "the hook pattern used (question, bold claim, counterintuitive, personal story, shock, challenge, how-to, etc)",
  "breakdown": [
    {"dimension": "Curiosity Gap", "score": 85, "note": "one line why"},
    {"dimension": "Emotional Pull", "score": 70, "note": "one line why"},
    {"dimension": "Pattern Interrupt", "score": 90, "note": "one line why"},
    {"dimension": "Specificity", "score": 65, "note": "one line why"},
    {"dimension": "Urgency", "score": 75, "note": "one line why"}
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvements": [
    {"text": "improved hook version 1", "score": 88},
    {"text": "improved hook version 2", "score": 82},
    {"text": "improved hook version 3", "score": 91}
  ],
  "platform_fit": [
    {"platform": "TikTok", "score": 85, "reason": "one line"},
    {"platform": "YouTube Shorts", "score": 75, "reason": "one line"},
    {"platform": "Instagram Reels", "score": 70, "reason": "one line"},
    {"platform": "LinkedIn Video", "score": 60, "reason": "one line"}
  ]
}

${PROMPT_PREFIX}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7, maxTokens: 1200, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { pattern: "unknown", breakdown: [], strengths: [], weaknesses: [], improvements: [], platform_fit: [] };
  }
}

export async function compareHooks(input: { hooks: string[]; platform: string }): Promise<{
  hooks: { text: string; scores: { dimension: string; score: number }[]; total: number }[];
  winner: { text: string; reason: string };
  recommendation: string;
}> {
  const hookList = input.hooks.map((h, i) => `${i + 1}. "${h}"`).join("\n");

  const prompt = `Compare these video hooks for ${input.platform}:

${hookList}

Score each hook on 1-100 for these 5 dimensions:
- Scroll-Stopping Power
- Clarity
- Emotional Resonance
- Algorithm Fit
- Shareability

Return JSON:
{
  "hooks": [
    {
      "text": "hook text",
      "scores": [
        {"dimension": "Scroll-Stopping Power", "score": 90},
        {"dimension": "Clarity", "score": 85},
        {"dimension": "Emotional Resonance", "score": 78},
        {"dimension": "Algorithm Fit", "score": 82},
        {"dimension": "Shareability", "score": 70}
      ],
      "total": 81
    }
  ],
  "winner": {"text": "winning hook text", "reason": "why it won"},
  "recommendation": "blend suggestion or publishing advice"
}

${PROMPT_PREFIX}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6, maxTokens: 1200, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { hooks: [], winner: { text: "", reason: "" }, recommendation: "" };
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

export async function deconstructVideo(input: {
  transcript: string;
  scenes: { start: number; end: number; title: string }[];
  platform: string;
}): Promise<{
  formula_name: string;
  formula_description: string;
  segments: { time: string; label: string; pattern: string; purpose: string; hook_text: string; score: number }[];
  emotional_arc: { point: string; level: number }[];
  viral_ingredients: string[];
  why_it_works: string;
}> {
  const sceneList = input.scenes.map((s, i) =>
    `Scene ${i + 1}: "${s.title}" (${fmtSeconds(s.start)}–${fmtSeconds(s.end)})`
  ).join("\n");

  const preview = input.transcript.slice(0, 5000);

  const prompt = `You are a viral video forensic analyst. Analyze this video's transcript and scene structure to reverse-engineer its viral formula.

PLATFORM: ${input.platform}

TRANSCRIPT:
"${preview}"

SCENE STRUCTURE:
${sceneList}

TASK:
1. Identify the OVERALL VIRAL FORMULA used (e.g., "Contrarian Reveal", "Emotional Journey", "Expert Myth-Buster", "Day-in-Life Pivot", "Shock-to-Value", etc.) — give it a catchy formula name and short description.
2. Break the video into 4-7 TIMELINE SEGMENTS. For each segment identify:
   - time range (MM:SS–MM:SS)
   - what the segment does (label: Hook, Context, Value, Proof, Twist, CTA, etc.)
   - the psychological pattern used (curiosity gap, social proof, pattern interrupt, authority, scarcity, storytelling, etc.)
   - the purpose of this segment in the viewer journey
   - extract the exact hook/key line spoken in this segment
   - score the segment's viral strength (1-100)
3. Map the EMOTIONAL ARC: 5 key points showing how viewer attention/emotion changes across the video (point name → attention level 1-100)
4. List 3-5 VIRAL INGREDIENTS that made this video work (specific techniques, not generic advice)
5. Write a concise "WHY THIS WORKED" analysis (2-3 sentences)

${PROMPT_PREFIX}

Return JSON:
{
  "formula_name": "catchy name like The Contrarian Tease",
  "formula_description": "one line formula summary",
  "segments": [
    {"time": "0:00-0:05", "label": "Hook", "pattern": "contrarian claim", "purpose": "stops scroll with disbelief", "hook_text": "the exact words", "score": 92}
  ],
  "emotional_arc": [
    {"point": "Opening hook", "level": 95},
    {"point": "Context setup", "level": 70},
    {"point": "Value peak", "level": 85},
    {"point": "Proof moment", "level": 90},
    {"point": "CTA close", "level": 60}
  ],
  "viral_ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
  "why_it_works": "analysis text"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6, maxTokens: 1800, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { formula_name: "Unknown", formula_description: "", segments: [], emotional_arc: [], viral_ingredients: [], why_it_works: "" };
  }
}

export async function remixWithFormula(input: {
  formula_name: string;
  formula_description: string;
  segments: { label: string; pattern: string; purpose: string }[];
  topic: string;
  platform: string;
  tone: "cinematic" | "contrarian" | "urgent";
}): Promise<{
  script: { label: string; text: string; purpose: string }[];
  hook: { text: string; score: number };
  title: string;
  hashtags: string[];
}> {
  const segmentGuide = input.segments.map(s => `- ${s.label}: ${s.purpose} (use ${s.pattern})`).join("\n");
  const tg = input.tone === "cinematic" ? "cinematic and visual" : input.tone === "contrarian" ? "bold and provocative" : "urgent and FOMO-driven";

  const prompt = `You are remixing a viral video using the "${input.formula_name}" formula.

FORMULA: ${input.formula_description}

FORMULA STRUCTURE:
${segmentGuide}

YOUR TOPIC: "${input.topic}"
PLATFORM: ${input.platform}
TONE: ${tg}

Remix this. Keep the EXACT same segment structure and pattern, but replace the topic with yours. Write fresh, original content that follows the formula blueprint precisely.

${PROMPT_PREFIX}

Return JSON:
{
  "script": [
    {"label": "Hook", "text": "your hook text", "purpose": "stops scroll"},
    {"label": "Context", "text": "context text", "purpose": "builds curiosity"},
    {"label": "Value", "text": "value text", "purpose": "delivers insight"},
    {"label": "CTA", "text": "cta text", "purpose": "drives action"}
  ],
  "hook": {"text": "the main hook", "score": 88},
  "title": "video title",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8, maxTokens: 1500, responseFormat: { type: "json_object" },
  });

  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { script: [], hook: { text: "", score: 0 }, title: "", hashtags: [] };
  }
}

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export async function retentionAnalysis(input: {
  script: string; platform: string;
}): Promise<{
  curve: { second: number; retention: number; note: string }[];
  dropoffs: { second: number; issue: string; fix: string }[];
  emotion_map: { second: number; emotion: string; intensity: number }[];
  broll_plan: { second: number; sentence: string; visual: string }[];
  readability: { score: number; issues: string; tips: string };
  sponsor_best_spot: { second: number; reason: string; transition: string };
}> {
  const prompt = `Analyze this video script for ${input.platform}:

"${input.script.slice(0, 3000)}"

Perform comprehensive retention engineering:

1. RETENTION CURVE: Predict second-by-second retention for the first 30 seconds. Every 3 seconds, estimate retention % and a brief note why.
2. DROP-OFF POINTS: Identify 2-4 exact moments where viewers will likely leave. For each: which second, why they leave, how to fix it.
3. EMOTION MAP: Map the emotional journey across the script. Every 5 seconds, name the dominant emotion (curiosity, shock, trust, urgency, confusion, excitement, boredom, empathy) and intensity (1-100).
4. B-ROLL PLAN: For every key sentence, suggest what should be VISUALLY on screen (not text, but visual imagery).
5. READABILITY: Score the script for spoken delivery (1-100). Flag any awkward phrases that don't sound natural aloud. Give 3 tips.
6. SPONSOR PLACEMENT: Identify the single BEST moment to insert a sponsor message. Give: exact position, why it works, a natural transition sentence.

${PROMPT_PREFIX}

Return JSON:
{
  "curve": [{"second": 0, "retention": 100, "note": "opening hook grabs attention"}],
  "dropoffs": [{"second": 8, "issue": "what loses them", "fix": "how to fix"}],
  "emotion_map": [{"second": 0, "emotion": "curiosity", "intensity": 85}],
  "broll_plan": [{"second": 3, "sentence": "the sentence", "visual": "what to show on screen"}],
  "readability": {"score": 75, "issues": "awkward phrases", "tips": "3 tips for better delivery"},
  "sponsor_best_spot": {"second": 22, "reason": "why this spot is optimal", "transition": "natural transition line"}
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6, maxTokens: 2000, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { curve: [], dropoffs: [], emotion_map: [], broll_plan: [], readability: { score: 0, issues: "", tips: "" }, sponsor_best_spot: { second: 0, reason: "", transition: "" } }; }
}

export async function generateAllPlatforms(input: {
  topic: string; tone: "cinematic" | "contrarian" | "urgent";
}): Promise<{
  platforms: { platform: string; hook: string; script: string; hashtags: string[]; thumbnail: string }[];
}> {
  const prompt = `Topic: "${input.topic}" — Tone: ${input.tone}

Create optimized content for ALL 5 platforms:
- TikTok (15-30s, raw/authentic, trending sound vibe)
- YouTube Shorts (30-60s, punchy, searchable)
- Instagram Reels (15-30s, aesthetic, emoji-rich, visual)
- LinkedIn Video (60-90s, professional, insight-driven)
- YouTube Long (3-5min script outline)

For each platform: write the HOOK, a short SCRIPT, 5 HASHTAGS, and THUMBNAIL TEXT. Each platform MUST have distinctly different hooks and style.

${PROMPT_PREFIX}

Return JSON:
{
  "platforms": [
    {"platform": "TikTok", "hook": "hook text", "script": "script text", "hashtags": ["#t1"], "thumbnail": "TEXT"},
    {"platform": "YouTube Shorts", "hook": "hook text", "script": "script text", "hashtags": ["#t1"], "thumbnail": "TEXT"},
    {"platform": "Instagram Reels", "hook": "hook text", "script": "script text", "hashtags": ["#t1"], "thumbnail": "TEXT"},
    {"platform": "LinkedIn Video", "hook": "hook text", "script": "script text", "hashtags": ["#t1"], "thumbnail": "TEXT"},
    {"platform": "YouTube", "hook": "hook text", "script": "script text", "hashtags": ["#t1"], "thumbnail": "TEXT"}
  ]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.85, maxTokens: 2500, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { platforms: [] }; }
}

export async function generateVariations(input: {
  topic: string; platform: string; tone: "cinematic" | "contrarian" | "urgent";
}): Promise<{
  variations: { pattern: string; hook: string; score: number }[];
}> {
  const prompt = `Topic: "${input.topic}" — Platform: ${input.platform} — Tone: ${input.tone}

Generate 10 DISTINCT hook variations, each using a DIFFERENT viral pattern:
1. Contrarian Claim (challenge a belief)
2. Shocking Statistic (data-driven opener)
3. Personal Confession (vulnerability)
4. Curiosity Gap (information tease)
5. How-To Promise (quick win)
6. Challenge (dare the viewer)
7. Emotional Story (paint a scene)
8. Urgent Warning (FOMO)
9. Relatable Observation (we all do this)
10. Authority Reveal (I discovered that...)

Each variation must be under 120 chars, sound natural, and fit the tone.

${PROMPT_PREFIX}

Return JSON:
{
  "variations": [
    {"pattern": "Contrarian Claim", "hook": "hook text", "score": 88},
    {"pattern": "Shocking Statistic", "hook": "hook text", "score": 82}
  ]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9, maxTokens: 2000, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { variations: [] }; }
}

export async function generateCalendar(input: {
  niche: string; platform: string; days: number; tone: "cinematic" | "contrarian" | "urgent";
}): Promise<{
  days: { day: number; topic: string; hook: string; hashtags: string[]; thumbnail: string }[];
}> {
  const prompt = `Niche: "${input.niche}" — Platform: ${input.platform} — Days: ${input.days}

Create a ${input.days}-day content calendar. Each day needs a FRESH content idea. Mix formats: educational, entertaining, personal story, trending reaction, behind-the-scenes, controversial take, challenge, tutorial, before-after, Q&A.

${PROMPT_PREFIX}

Return JSON:
{
  "days": [
    {"day": 1, "topic": "topic title", "hook": "scroll-stopping hook", "hashtags": ["#t1","#t2","#t3","#t4","#t5"], "thumbnail": "THUMBNAIL TEXT"}
  ]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9, maxTokens: 3000, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { days: [] }; }
}

export async function generateSalesFunnel(input: {
  product: string; platform: string; tone: "cinematic" | "contrarian" | "urgent";
}): Promise<{
  stages: { stage: string; number: number; goal: string; hook: string; script: string; cta: string }[];
}> {
  const prompt = `Product: "${input.product}" — Platform: ${input.platform}

Build a 4-video sales funnel:

Stage 1 (Awareness): Hook a broad audience, introduce the PROBLEM, don't mention the product.
Stage 2 (Trust): Share personal experience/story, build credibility, subtle product mention.
Stage 3 (Urgency): Show results/proof, create desire, highlight what they're missing.
Stage 4 (Conversion): Direct offer, clear CTA, scarcity element, close the sale.

For each stage provide: HOOK, full SCRIPT, and CTA.

${PROMPT_PREFIX}

Return JSON:
{
  "stages": [
    {"stage": "Awareness", "number": 1, "goal": "problem awareness", "hook": "hook text", "script": "full script", "cta": "cta text"},
    {"stage": "Trust", "number": 2, "goal": "build credibility", "hook": "hook text", "script": "full script", "cta": "cta text"},
    {"stage": "Urgency", "number": 3, "goal": "create desire", "hook": "hook text", "script": "full script", "cta": "cta text"},
    {"stage": "Conversion", "number": 4, "goal": "close the sale", "hook": "hook text", "script": "full script", "cta": "cta text"}
  ]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8, maxTokens: 2000, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { stages: [] }; }
}

export async function crossNicheRemix(input: {
  source_niche: string; target_niche: string; formula_name: string; formula_description: string;
  segments: { label: string; pattern: string; purpose: string }[];
  platform: string; tone: "cinematic" | "contrarian" | "urgent";
}): Promise<{
  adapted_hook: string;
  adapted_script: { label: string; text: string }[];
  title: string;
  hashtags: string[];
  adaptation_notes: string;
}> {
  const segList = input.segments.map(s => `- ${s.label}: ${s.purpose} (pattern: ${s.pattern})`).join("\n");

  const prompt = `SOURCE NICHE: ${input.source_niche}
TARGET NICHE: ${input.target_niche}
PLATFORM: ${input.platform}

VIRAL FORMULA: "${input.formula_name}" — ${input.formula_description}

FORMULA STRUCTURE:
${segList}

ADAPT this formula from ${input.source_niche} to ${input.target_niche}. Keep the EXACT same structure, but translate EVERYTHING to the target niche's language, examples, references, and audience expectations.

Write adaptation notes explaining the key changes made.

${PROMPT_PREFIX}

Return JSON:
{
  "adapted_hook": "the adapted hook",
  "adapted_script": [{"label": "Hook", "text": "text"}, {"label": "Context", "text": "text"}],
  "title": "video title",
  "hashtags": ["#t1","#t2","#t3","#t4","#t5"],
  "adaptation_notes": "how the formula was adapted"
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8, maxTokens: 1500, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { adapted_hook: "", adapted_script: [], title: "", hashtags: [], adaptation_notes: "" }; }
}

export async function preflightCheck(input: {
  hook: string; script: string; platform: string; hashtags: string[]; thumbnail: string;
}): Promise<{
  checks: { name: string; passed: boolean; score: number; detail: string }[];
  overall_score: number;
  ready_to_publish: boolean;
  critical_fixes: string[];
}> {
  const prompt = `Review this video content for ${input.platform}:

HOOK: "${input.hook}"
SCRIPT: "${input.script.slice(0, 1500)}"
HASHTAGS: ${input.hashtags.join(" ")}
THUMBNAIL: "${input.thumbnail}"

Run a pre-publish checklist:

1. HOOK IMPACT (1-100): Does it stop the scroll in 1.5s? Pattern break strength?
2. RETENTION RISK (1-100): Any boring sections? Pacing issues?
3. CTA POSITION (1-100): Is the call-to-action in the optimal spot?
4. HASHTAG STRATEGY (1-100): Right mix of broad, niche, trending?
5. THUMBNAIL HOOK (1-100): Curiosity factor? Readability? Contrast?
6. PLATFORM FIT (1-100): Optimized for this specific platform?
7. EMOTIONAL ARC (1-100): Does the emotional journey build correctly?

For each check: name, passed (true if score >= 65), score (1-100), one-line detail.
If any check scores below 50, add a critical fix suggestion.

${PROMPT_PREFIX}

Return JSON:
{
  "checks": [
    {"name": "Hook Impact", "passed": true, "score": 82, "detail": "strong pattern interrupt"},
    {"name": "Retention Risk", "passed": false, "score": 48, "detail": "0:08-0:12 loses momentum"}
  ],
  "overall_score": 72,
  "ready_to_publish": false,
  "critical_fixes": ["Fix drop-off at 0:08 - shorten context section"]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5, maxTokens: 1200, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { checks: [], overall_score: 0, ready_to_publish: false, critical_fixes: [] }; }
}

export async function analyzeCreatorDNA(input: {
  videos: { hook: string; platform: string; views: number; likes: number; comments: number; date?: string }[];
  niche: string;
}): Promise<{
  profile: { label: string; value: string; insight: string }[];
  winning_patterns: { pattern: string; avg_views: number; count: number; example: string }[];
  losing_patterns: { pattern: string; avg_views: number; count: number; fix: string }[];
  platform_breakdown: { platform: string; avg_views: number; best_pattern: string; count: number }[];
  audience_psychology: { trait: string; evidence: string; recommendation: string }[];
  best_time: string;
  overall_grade: string;
  dna_summary: string;
}> {
  const vidList = input.videos.map((v, i) =>
    `#${i + 1}: "${v.hook}" | ${v.platform} | ${v.views.toLocaleString()} views | ${v.likes.toLocaleString()} likes | ${v.comments} comments${v.date ? ` | ${v.date}` : ""}`
  ).join("\n");

  const prompt = `You are a data-driven Creator Performance Analyst. Analyze this creator's video history:

NICHE: ${input.niche}

VIDEO HISTORY:
${vidList}

TASK: Build a complete CREATOR DNA PROFILE. Be SPECIFIC, not generic.

1. PROFILE: 6-8 key insights about this creator (label + value + detailed insight per row). Include: their strongest hook pattern, their audience's emotional trigger, their best performing format, their ideal video length indicator, their unique advantage, their blind spot.

2. WINNING PATTERNS: Identify 2-3 hook PATTERNS that consistently outperform. For each: pattern name, average views, how many times used, best example hook.

3. LOSING PATTERNS: Identify 1-2 hook PATTERNS that underperform. For each: pattern name, average views, how many times used, why they fail + how to fix.

4. PLATFORM BREAKDOWN: For each platform they posted on: average views, best performing pattern, count of videos.

5. AUDIENCE PSYCHOLOGY: 3-4 psychological traits of their audience based on what content they engage with. For each: trait name, evidence from data, recommendation for future content.

6. BEST TIME: Based on patterns, what type of content/cadence works best for this creator.

7. OVERALL GRADE: A (viral machine), B (strong, needs consistency), C (finding footing), D (needs strategy shift).

8. DNA SUMMARY: 2-3 sentences that capture this creator's unique content DNA.

${PROMPT_PREFIX}

Return JSON:
{
  "profile": [{"label": "Strongest Pattern", "value": "Contrarian Claims", "insight": "Your 3 contrarian hooks averaged 142K views vs 38K for other patterns"}],
  "winning_patterns": [{"pattern": "Contrarian Claim", "avg_views": 142000, "count": 3, "example": "Everyone lies about AI income"}],
  "losing_patterns": [{"pattern": "How-To Tease", "avg_views": 12000, "count": 2, "fix": "Your how-to hooks lack pattern interrupt — add a shocking stat first"}],
  "platform_breakdown": [{"platform": "TikTok", "avg_views": 95000, "best_pattern": "Contrarian", "count": 5}],
  "audience_psychology": [{"trait": "Skepticism Seekers", "evidence": "Your contrarian hooks get 5x more comments", "recommendation": "Lean into debunking popular myths"}],
  "best_time": "Post contrarian takes Tues-Thu 7-9PM when your audience is most skeptical",
  "overall_grade": "B+",
  "dna_summary": "You're a myth-buster with a contrarian edge. Your audience comes for truth bombs, stays for your unique perspective. Double down on what makes them uncomfortable."
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6, maxTokens: 2500, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch {
    return { profile: [], winning_patterns: [], losing_patterns: [], platform_breakdown: [], audience_psychology: [], best_time: "", overall_grade: "C", dna_summary: "" };
  }
}

export async function generateDNAOptimized(input: {
  topic: string;
  platform: string;
  dna_profile: { label: string; value: string }[];
  winning_patterns: string[];
  audience_traits: string[];
}): Promise<{
  hooks: { text: string; score: number; why: string }[];
  title: string;
  hashtags: string[];
}> {
  const profileLines = input.dna_profile.map(p => `- ${p.label}: ${p.value}`).join("\n");
  const patterns = input.winning_patterns.join(", ");
  const traits = input.audience_traits.join(", ");

  const prompt = `You are generating hooks OPTIMIZED for a specific creator's proven DNA.

TOPIC: "${input.topic}"
PLATFORM: ${input.platform}

CREATOR'S WINNING PATTERNS: ${patterns}
AUDIENCE PSYCHOLOGY: ${traits}

CREATOR PROFILE:
${profileLines}

Generate 3 hooks that:
- Use this creator's PROVEN winning patterns
- Speak directly to their audience's psychological traits
- Match their unique voice and style
- Are under 120 characters
- Each has a brief "why this works for YOU specifically"

${PROMPT_PREFIX}

Return JSON:
{
  "hooks": [
    {"text": "hook text", "score": 88, "why": "Uses your contrarian pattern + appeals to your skepticism-seeking audience"},
    {"text": "hook text", "score": 85, "why": "reason specific to this creator"},
    {"text": "hook text", "score": 91, "why": "reason specific to this creator"}
  ],
  "title": "optimized title",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}`;

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8, maxTokens: 1200, responseFormat: { type: "json_object" },
  });
  const raw = extract(res.choices?.[0]?.message?.content);
  try { return JSON.parse(raw); } catch { return { hooks: [], title: "", hashtags: [] }; }
}
