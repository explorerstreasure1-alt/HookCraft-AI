"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useMemo, useState } from "react";

type HookSet = {
  id: number;
  topic: string;
  platform: string;
  hooks: string[];
};

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];

const sampleArchive: HookSet[] = [
  {
    id: 101,
    topic: "AI side hustle myth",
    platform: "YouTube Shorts",
    hooks: [
      "Everyone is selling the AI dream but this is the part nobody puts in the tutorial",
      "I tried the laziest AI side hustle for 7 days the numbers got uncomfortable",
      "Before you buy another AI course watch this 20 second reality check",
    ],
  },
  {
    id: 102,
    topic: "Founder burnout",
    platform: "TikTok",
    hooks: [
      "Your startup is not failing because you are slow it is failing because your brain never leaves work",
      "This tiny founder habit looked productive until it started deleting my weekends",
      "If your calendar looks successful but your body does not this is for you",
    ],
  },
];

export default function HookGenerator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState("cinematic");
  const [credits, setCredits] = useState<number | null>(null);
  const [archive, setArchive] = useState<HookSet[]>(sampleArchive);
  const [activeId, setActiveId] = useState(sampleArchive[0].id);
  const [copiedHook, setCopiedHook] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeSet = useMemo(
    () => archive.find((item) => item.id === activeId) ?? archive[0],
    [activeId, archive]
  );

  useEffect(() => {
    fetch("/api/credits")
      .then((res) => res.json())
      .then((data: { credits: number }) => {
        if (data.credits !== undefined) setCredits(data.credits);
      })
      .catch(() => setCredits(3));
  }, []);

  async function handleGenerate() {
    if (loading) return;
    if (!topic.trim()) {
      setError("Please enter a video topic.");
      return;
    }
    if (credits !== null && credits <= 0) {
      setError("No credits remaining. Buy a pack below.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), platform, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed.");
        setLoading(false);
        return;
      }

      const nextSet: HookSet = {
        id: Date.now(),
        topic: topic.trim(),
        platform,
        hooks: data.hooks ?? [],
      };

      setArchive((current) => [nextSet, ...current].slice(0, 5));
      setActiveId(nextSet.id);

      if (data.credits !== undefined) setCredits(data.credits);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyHook(hook: string) {
    try {
      await navigator.clipboard.writeText(hook);
      setCopiedHook(hook);
      window.setTimeout(() => setCopiedHook(""), 1400);
    } catch {
      setCopiedHook("Copy unavailable");
    }
  }

  return (
    <section id="dashboard" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Creator dashboard</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Generate hooks, keep history nested, copy the winner instantly.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            {user
              ? "Powered by Mistral AI. Enter your video topic, pick a tone, and get 3 scroll-stopping hooks. Your credits are saved to your account."
              : "You are using a guest session. Sign in to save your credits across devices."}
          </p>
        </div>

        {!user && (
          <div className="mt-8 border border-[#d4af37]/30 bg-[#1a2332]/50 p-5 rounded-lg flex items-center justify-between gap-4 flex-col sm:flex-row">
            <p className="text-sm text-[#fdfbf7]/70">
              Guest mode: credits are tied to this browser. Sign in for cross-device access.
            </p>
            <a
              href="/auth"
              className="shrink-0 rounded-full bg-[#d4af37] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#121214] transition hover:bg-[#f0d36b]"
            >
              Sign In Free
            </a>
          </div>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="border border-white/10 bg-[#121214] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#fdfbf7]/48">Archive</p>
                <p className="mt-1 text-lg font-semibold text-[#fdfbf7]">Matryoshka sessions</p>
              </div>
              <span className="rounded-full bg-[#d4af37]/12 px-3 py-1 text-xs font-semibold text-[#d4af37]">
                {credits !== null ? `${credits} credits` : "..."}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {archive.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={`w-full border-l px-4 py-4 text-left transition ${
                    item.id === activeId
                      ? "border-[#d4af37] bg-[#1a2332] text-[#fdfbf7]"
                      : "border-white/10 text-[#fdfbf7]/58 hover:border-[#d4af37]/60 hover:bg-white/[0.03]"
                  }`}
                  style={{
                    marginLeft: `${Math.min(index, 3) * 10}px`,
                    width: `calc(100% - ${Math.min(index, 3) * 10}px)`,
                  }}
                >
                  <span className="block text-xs uppercase tracking-[0.2em] text-[#d4af37]/80">
                    {item.platform}
                  </span>
                  <span className="mt-1 block font-medium">{item.topic}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="border border-white/10 bg-[#1a2332]/82 p-6">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37]" htmlFor="topic">
                Video topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-4 min-h-32 w-full resize-none border border-white/10 bg-[#121214] p-4 text-base leading-7 text-[#fdfbf7] outline-none transition placeholder:text-[#fdfbf7]/30 focus:border-[#d4af37]/70"
                placeholder="Describe the creator angle, offer, or story tension..."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[#fdfbf7]/50" htmlFor="platform">
                    Platform
                  </label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    className="mt-3 w-full border border-white/10 bg-[#121214] px-4 py-3 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/70"
                  >
                    {platforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[#fdfbf7]/50" htmlFor="tone">
                    Hook tone
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                    className="mt-3 w-full border border-white/10 bg-[#121214] px-4 py-3 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/70"
                  >
                    <option value="cinematic">Cinematic tension</option>
                    <option value="contrarian">Contrarian</option>
                    <option value="urgent">Urgent swipe-stopper</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || (credits !== null && credits <= 0)}
                className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] transition hover:bg-[#f0d36b] disabled:cursor-not-allowed disabled:bg-[#fdfbf7]/20 disabled:text-[#fdfbf7]/45"
              >
                {loading ? "Generating..." : credits !== null && credits > 0 ? "Architect 3 Hooks" : "Buy credits to continue"}
              </button>
            </div>

            <div className="border border-[#d4af37]/24 bg-[#121214] p-6 shadow-[0_0_60px_rgba(212,175,55,0.08)]">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">AI output</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{activeSet.topic}</h3>
                </div>
                <span className="shrink-0 border border-white/10 px-3 py-2 text-xs text-[#fdfbf7]/58">
                  {activeSet.platform}
                </span>
              </div>
              <div className="space-y-4">
                {activeSet.hooks.map((hook, index) => (
                  <div
                    key={hook}
                    className="group border border-white/10 bg-[#1a2332]/58 p-4 transition hover:border-[#d4af37]/55"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-sm text-[#d4af37]">0{index + 1}</span>
                      <p className="flex-1 text-lg leading-7 text-[#fdfbf7]/86">{hook}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyHook(hook)}
                      className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37] transition group-hover:text-[#f0d36b]"
                    >
                      {copiedHook === hook ? "Copied" : "Copy hook"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
