"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "./Toast";

type ResultSet = {
  id: number;
  topic: string;
  platform: string;
  mode: "hooks" | "script";
  hooks?: string[];
  title?: string;
  hashtags?: string[];
  hook?: string;
  body?: string;
  cta?: string;
  description?: string;
  sound?: string;
};

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];

const templates = [
  { emoji: "🔥", label: "Hot Take", topic: "An unpopular opinion about my industry that will make people furious" },
  { emoji: "😱", label: "Mistake", topic: "The biggest mistake I made that cost me 6 months of progress" },
  { emoji: "💰", label: "Side Hustle", topic: "How I made my first $1000 online with zero followers" },
  { emoji: "📈", label: "Growth Hack", topic: "The one strategy that doubled my views in 7 days" },
  { emoji: "🎬", label: "Behind Scenes", topic: "What a day in my life actually looks like no filter" },
  { emoji: "🧠", label: "Psychology", topic: "This psychological trick makes people watch till the end" },
  { emoji: "⚡", label: "Quick Tip", topic: "One 30-second change that improved my content instantly" },
  { emoji: "😤", label: "Rant", topic: "Why everyone is wrong about this popular trend" },
];

const sampleArchive: ResultSet[] = [
  {
    id: 101,
    topic: "AI side hustle myth",
    platform: "YouTube Shorts",
    mode: "hooks",
    hooks: ["Everyone is selling the AI dream but this is the part nobody puts in the tutorial"],
    title: "The AI Side Hustle Myth",
    hashtags: ["#ai", "#sidehustle", "#truth"],
  },
];

export default function HookGenerator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState("cinematic");
  const [mode, setMode] = useState<"hooks" | "script">("hooks");
  const [credits, setCredits] = useState<number | null>(null);
  const [archive, setArchive] = useState<ResultSet[]>(sampleArchive);
  const [activeId, setActiveId] = useState(sampleArchive[0].id);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const prevCredits = useRef<number | null>(null);

  const activeSet = useMemo(() => archive.find((i) => i.id === activeId) ?? archive[0], [activeId, archive]);

  function fetchCredits() {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d: { credits: number }) => {
        if (d.credits !== undefined) {
          const prev = prevCredits.current;
          if (prev !== null && d.credits > prev) showToast(`Credits added! You now have ${d.credits} credits.`, "success");
          setCredits(d.credits);
          prevCredits.current = d.credits;
          window.dispatchEvent(new CustomEvent("credits-updated", { detail: d.credits }));
        }
      })
      .catch(() => setCredits(3));
  }

  useEffect(() => {
    fetchCredits();
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (sessionStorage.getItem("hc_bought") === "1") {
        sessionStorage.removeItem("hc_bought");
        setTimeout(fetchCredits, 5000);
        setTimeout(fetchCredits, 10000);
      } else fetchCredits();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function handleGenerate() {
    if (loading) return;
    if (!topic.trim()) { setError("Please enter a video topic."); return; }
    if (credits !== null && credits <= 0) { setError("No credits remaining. Buy a pack below."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), platform, tone, mode }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Generation failed."); setLoading(false); return; }
      const next: ResultSet = {
        id: Date.now(), topic: topic.trim(), platform, mode: d.mode,
        hooks: d.hooks, title: d.title, hashtags: d.hashtags,
        hook: d.hook, body: d.body, cta: d.cta, description: d.description, sound: d.sound,
      };
      setArchive((c) => [next, ...c].slice(0, 10));
      setActiveId(next.id);
      if (d.credits !== undefined) setCredits(d.credits);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(text); window.setTimeout(() => setCopied(""), 1400); }
    catch { setCopied("Copy unavailable"); }
  }

  return (
    <section id="dashboard" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Creator dashboard</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Generate hooks, scripts, hashtags & more.</h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">{user ? "Everything you need to post. Powered by Mistral AI." : "Guest mode. Sign in to save credits across devices."}</p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/8 px-5 py-3">
              <span className="text-2xl font-bold text-[#d4af37]">{credits !== null ? credits : "..."}</span>
              <span className="text-sm uppercase tracking-[0.2em] text-[#fdfbf7]/60">{credits === 1 ? "credit" : "credits"} left</span>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-5 py-3">
              <span className="text-xl font-bold text-[#fdfbf7]/50">{archive.length - 1}</span>
              <span className="text-sm uppercase tracking-[0.15em] text-[#fdfbf7]/35">generated</span>
            </div>
            {credits !== null && credits <= 1 && <a href="#pricing" className="text-xs font-semibold uppercase tracking-[0.15em] text-[#d4af37] hover:text-[#f0d36b] transition">Buy credits ↓</a>}
          </div>
        </div>

        {!user && (
          <div className="mt-8 border border-[#d4af37]/30 bg-[#1a2332]/50 p-5 rounded-lg flex items-center justify-between gap-4 flex-col sm:flex-row">
            <p className="text-sm text-[#fdfbf7]/70">Guest mode: credits stay on this browser. Sign in for cross-device access.</p>
            <a href="/auth" className="shrink-0 rounded-full bg-[#d4af37] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#121214] transition hover:bg-[#f0d36b]">Sign In Free</a>
          </div>
        )}

        <div className="mt-8 grid gap-2 grid-cols-4 sm:grid-cols-8">
          {templates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTopic(t.topic)}
              className="border border-white/10 bg-[#121214] px-3 py-3 text-center text-[11px] leading-tight text-[#fdfbf7]/60 transition hover:border-[#d4af37]/50 hover:text-[#fdfbf7] rounded-xl"
            >
              <span className="block text-lg mb-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="border border-white/10 bg-[#121214] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><p className="text-xs uppercase tracking-[0.24em] text-[#fdfbf7]/48">Archive</p><p className="mt-1 text-lg font-semibold text-[#fdfbf7]">Sessions</p></div>
            </div>
            <div className="mt-5 space-y-3">
              {archive.map((item, index) => (
                <button key={item.id} type="button" onClick={() => setActiveId(item.id)}
                  className={`w-full border-l px-4 py-4 text-left transition ${item.id === activeId ? "border-[#d4af37] bg-[#1a2332] text-[#fdfbf7]" : "border-white/10 text-[#fdfbf7]/58 hover:border-[#d4af37]/60 hover:bg-white/[0.03]"}`}
                  style={{ marginLeft: `${Math.min(index, 3) * 10}px`, width: `calc(100% - ${Math.min(index, 3) * 10}px)` }}>
                  <span className="block text-xs uppercase tracking-[0.2em] text-[#d4af37]/80">{item.platform}</span>
                  <span className="mt-1 block font-medium text-sm">{item.topic}</span>
                  <span className="mt-1 text-[10px] text-[#fdfbf7]/30">{item.mode === "script" ? "Full Script" : "Hooks"}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="border border-white/10 bg-[#1a2332]/82 p-6">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37]" htmlFor="topic">Video topic</label>
              <textarea id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}
                className="mt-4 min-h-24 w-full resize-none border border-white/10 bg-[#121214] p-4 text-base leading-7 text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/30 focus:border-[#d4af37]/70"
                placeholder="Describe your video idea, story, or angle..." />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[#fdfbf7]/50" htmlFor="platform">Platform</label>
                  <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-3 w-full border border-white/10 bg-[#121214] px-4 py-3 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/70">
                    {platforms.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[#fdfbf7]/50" htmlFor="tone">Style</label>
                  <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="mt-3 w-full border border-white/10 bg-[#121214] px-4 py-3 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/70">
                    <option value="cinematic">Cinematic</option>
                    <option value="contrarian">Contrarian</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex rounded-full border border-white/10 bg-[#121214] p-1">
                <button type="button" onClick={() => setMode("hooks")} className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${mode === "hooks" ? "bg-[#d4af37] text-[#121214]" : "text-[#fdfbf7]/50"}`}>Hooks + Tags</button>
                <button type="button" onClick={() => setMode("script")} className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${mode === "script" ? "bg-[#d4af37] text-[#121214]" : "text-[#fdfbf7]/50"}`}>Full Script</button>
              </div>
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
              <button type="button" onClick={handleGenerate} disabled={loading || (credits !== null && credits <= 0)}
                className="mt-4 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] transition hover:bg-[#f0d36b] disabled:cursor-not-allowed disabled:bg-[#fdfbf7]/20 disabled:text-[#fdfbf7]/45">
                {loading ? "Generating..." : credits !== null && credits > 0 ? (mode === "script" ? "Generate Full Script" : "Generate Hooks") : "Buy credits to continue"}
              </button>
            </div>

            <div className="border border-[#d4af37]/24 bg-[#121214] p-6 shadow-[0_0_60px_rgba(212,175,55,0.08)] overflow-y-auto max-h-[700px]">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div><p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">AI Output</p><h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] line-clamp-2">{activeSet.topic}</h3></div>
                <span className="shrink-0 border border-white/10 px-3 py-2 text-xs text-[#fdfbf7]/58">{activeSet.platform}</span>
              </div>

              {activeSet.title && (
                <div className="mb-4 border border-white/10 bg-[#1a2332]/30 p-3 rounded-lg">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-1">Title</p>
                  <p className="text-base font-semibold text-[#fdfbf7]">{activeSet.title}</p>
                  <button onClick={() => copyText(activeSet.title!)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === activeSet.title ? "Copied" : "Copy"}</button>
                </div>
              )}

              {activeSet.mode === "script" && activeSet.hook ? (
                <div className="space-y-4">
                  <OutputBlock label="Hook (first 3s)" text={activeSet.hook} copied={copied} onCopy={copyText} highlight />
                  <OutputBlock label="Body" text={activeSet.body || ""} copied={copied} onCopy={copyText} />
                  <OutputBlock label="Call to Action" text={activeSet.cta || ""} copied={copied} onCopy={copyText} highlight />
                  {activeSet.description && <OutputBlock label="Description" text={activeSet.description} copied={copied} onCopy={copyText} />}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSet.hooks?.map((hook, i) => (
                    <div key={hook + i} className="group border border-white/10 bg-[#1a2332]/58 p-4 transition hover:border-[#d4af37]/55">
                      <div className="flex items-start gap-3"><span className="font-mono text-sm text-[#d4af37]">0{i + 1}</span><p className="flex-1 text-base leading-7 text-[#fdfbf7]/86">{hook}</p></div>
                      <button onClick={() => copyText(hook)} className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 group-hover:text-[#f0d36b]">{copied === hook ? "Copied" : "Copy"}</button>
                    </div>
                  ))}
                </div>
              )}

              {activeSet.hashtags && activeSet.hashtags.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-3">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSet.hashtags.map((tag) => (
                      <button key={tag} onClick={() => copyText(tag)}
                        className="border border-[#d4af37]/20 bg-[#d4af37]/5 px-3 py-1.5 text-xs text-[#d4af37] rounded-full hover:bg-[#d4af37]/15 transition">
                        {copied === tag ? "Copied!" : tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSet.sound && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2">Suggested Sound</p>
                  <p className="text-sm text-[#fdfbf7]/60 italic">"{activeSet.sound}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutputBlock({ label, text, copied, onCopy, highlight }: { label: string; text: string; copied: string; onCopy: (t: string) => void; highlight?: boolean }) {
  return (
    <div className={`border p-4 ${highlight ? "border-[#d4af37]/30 bg-[#d4af37]/3" : "border-white/10 bg-[#1a2332]/40"}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2">{label}</p>
      <p className={`leading-7 ${highlight ? "text-lg text-[#fdfbf7]/90" : "text-sm text-[#fdfbf7]/74"}`}>{text}</p>
      <button onClick={() => onCopy(text)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === text ? "Copied" : "Copy"}</button>
    </div>
  );
}
