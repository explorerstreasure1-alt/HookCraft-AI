"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "./Toast";

type HookItem = { text: string; score: number };

type ResultSet = {
  id: number; topic: string; platform: string; mode: string;
  hooks?: HookItem[]; title?: string; hashtags?: string[]; thumbnail?: string;
  hook?: HookItem; body?: string; cta?: string; description?: string; sound?: string;
};

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];

const templates = [
  { e: "🔥", l: "Hot Take", t: "An unpopular opinion about my industry" },
  { e: "😱", l: "Mistake", t: "My biggest mistake that cost me months" },
  { e: "💰", l: "Side Hustle", t: "How I made money online with zero followers" },
  { e: "📈", l: "Growth", t: "The strategy that doubled my views fast" },
  { e: "🎬", l: "BTS", t: "A raw day in my life no filter" },
  { e: "🧠", l: "Psychology", t: "Psychological tricks that keep people watching" },
  { e: "⚡", l: "Quick Tip", t: "One quick change that improved everything" },
  { e: "😤", l: "Rant", t: "Why everyone is wrong about this trend" },
];

const trends: Record<string, string[]> = {
  "TikTok": ["Day in the life transitions", "Silent vlog aesthetic", "Controversial industry secrets", "Budget vs expensive comparison", "Reaction to viral drama"],
  "YouTube Shorts": ["AI tool reviews", "Quick coding tips", "Gaming highlight clips", "Cooking hacks in 30s", "Motivational 1-min talks"],
  "Instagram Reels": ["Travel aesthetic montages", "Fashion try-on hauls", "Before-after transformations", "Quote over cinematic clips", "Restaurant reviews 30s"],
  "LinkedIn Video": ["Career pivoting stories", "Leadership hot takes", "Startup fundraising BTS", "Remote work productivity", "Networking at events raw"],
};

const sample: ResultSet = { id: 101, topic: "AI side hustle myth", platform: "YouTube Shorts", mode: "hooks", hooks: [{ text: "Everyone sells the AI dream but nobody shows this part", score: 87 }], title: "The AI Side Hustle Myth", hashtags: ["#ai", "#truth"], thumbnail: "AI EXPOSED" };

export default function HookGenerator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState("cinematic");
  const [mode, setMode] = useState<"hooks" | "script" | "series">("hooks");
  const [credits, setCredits] = useState<number | null>(null);
  const [archive, setArchive] = useState<ResultSet[]>([sample]);
  const [activeId, setActiveId] = useState(sample.id);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const prevCredits = useRef<number | null>(null);

  const activeSet = useMemo(() => archive.find(i => i.id === activeId) ?? archive[0], [activeId, archive]);

  function fetchCredits() {
    fetch("/api/credits").then(r => r.json()).then((d: { credits: number }) => {
      if (d.credits !== undefined) {
        const p = prevCredits.current;
        if (p !== null && d.credits > p) showToast(`Credits added! You now have ${d.credits} credits.`, "success");
        setCredits(d.credits); prevCredits.current = d.credits;
        window.dispatchEvent(new CustomEvent("credits-updated", { detail: d.credits }));
      }
    }).catch(() => setCredits(3));
  }

  useEffect(() => {
    fetchCredits();
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (sessionStorage.getItem("hc_bought") === "1") { sessionStorage.removeItem("hc_bought"); setTimeout(fetchCredits, 5000); setTimeout(fetchCredits, 10000); }
      else fetchCredits();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function handleGenerate() {
    if (loading) return;
    const cost = mode === "series" ? 3 : 1;
    if (!topic.trim()) { setError("Enter a topic."); return; }
    if (credits !== null && credits < cost) { setError(`Need ${cost} credits. You have ${credits}.`); return; }
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), platform, tone, mode }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed."); setLoading(false); return; }
      const next: ResultSet = {
        id: Date.now(), topic: topic.trim(), platform, mode: d.mode,
        hooks: d.hooks, title: d.title, hashtags: d.hashtags, thumbnail: d.thumbnail,
        hook: d.hook, body: d.body, cta: d.cta, description: d.description, sound: d.sound,
      };
      setArchive(c => [next, ...c].slice(0, 15));
      setActiveId(next.id);
      if (d.credits !== undefined) setCredits(d.credits);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(""), 1400); } catch { setCopied("Copy unavailable"); }
  }

  async function handleFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    if (!isImage && !isVideo && !isAudio) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (isImage) {
          const r = await fetch("/api/analyze", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: reader.result as string }),
          });
          const d = await r.json();
          if (d.topic) { setTopic(d.topic); showToast("Screenshot analyzed!", "success"); }
        } else {
          const base64 = (reader.result as string).split(",")[1];
          const r = await fetch("/api/transcribe", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, type: isVideo ? "video" : "audio" }),
          });
          const d = await r.json();
          if (d.topic) { setTopic(d.topic); showToast("Speech transcribed! Topic filled.", "success"); }
          else if (d.text) { setTopic(`Video about: ${d.text.slice(0, 200)}`); showToast("Transcribed!", "success"); }
        }
      } catch { setError("Analysis failed."); }
      finally { setAnalyzing(false); }
    };
    if (isImage) reader.readAsDataURL(file);
    else reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const file = e.clipboardData.files[0];
    if (file) { e.preventDefault(); handleFile(file); }
  }

  function downloadTXT() {
    const s = activeSet;
    let txt = `HookCraft AI - ${s.platform} - ${s.topic}\n${"=".repeat(50)}\n\n`;
    if (s.title) txt += `TITLE: ${s.title}\n\n`;
    if (s.thumbnail) txt += `THUMBNAIL: ${s.thumbnail}\n\n`;
    if (s.mode === "script" && s.hook) {
      txt += `HOOK: ${s.hook.text} (score: ${s.hook.score})\n\n`;
      if (s.body) txt += `BODY:\n${s.body}\n\n`;
      if (s.cta) txt += `CTA: ${s.cta}\n\n`;
      if (s.description) txt += `DESCRIPTION:\n${s.description}\n\n`;
    } else if (s.hooks) {
      txt += `HOOKS:\n`;
      s.hooks.forEach((h, i) => { txt += `  ${i + 1}. ${h.text} (score: ${h.score})\n`; });
      txt += "\n";
    }
    if (s.hashtags) txt += `HASHTAGS: ${s.hashtags.join(" ")}\n\n`;
    if (s.sound) txt += `SOUND: ${s.sound}\n`;

    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hookcraft-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const cost = mode === "series" ? 3 : 1;

  return (
    <section id="dashboard" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Creator dashboard</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Hooks, scripts, hashtags, thumbnails, series.</h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">{user ? "Everything you need to post. Powered by Mistral AI." : "Guest mode. Sign in to save credits."}</p>
          <div className="mt-8 flex items-stretch gap-4 flex-wrap">
            <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#1a2332] to-[#0f151c] p-6 min-w-[180px] flex-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_60%)]" />
              <p className="relative text-[10px] uppercase tracking-[0.25em] text-[#d4af37]/50 mb-3">Available Credits</p>
              <div className="relative flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-[-0.04em] text-[#d4af37]">{credits !== null ? credits : "..."}</span>
                <span className="text-sm text-[#fdfbf7]/30 uppercase tracking-wider">{credits === 1 ? "credit" : "credits"}</span>
              </div>
              <div className="relative mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d36b] transition-all duration-700" style={{ width: `${credits !== null ? Math.min(100, Math.max(0, (credits / 10) * 100)) : 0}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121214]/50 p-6 min-w-[140px] flex-1 flex flex-col justify-center items-center">
              <span className="text-4xl font-bold text-[#fdfbf7]/40">{archive.length - 1}</span>
              <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#fdfbf7]/25">generated</span>
            </div>
            {credits !== null && credits < cost && (
              <a href="#pricing" className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-6 min-w-[140px] flex-1 flex flex-col justify-center items-center hover:bg-[#d4af37]/10 transition group">
                <span className="text-2xl font-bold text-[#d4af37] group-hover:scale-110 transition">+</span>
                <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#d4af37]/60">Buy more</span>
              </a>
            )}
          </div>
        </div>

        {!user && (
          <div className="mt-8 border border-[#d4af37]/30 bg-[#1a2332]/50 p-5 rounded-lg flex items-center justify-between gap-4 flex-col sm:flex-row">
            <p className="text-sm text-[#fdfbf7]/70">Guest mode. Sign in for cross-device access.</p>
            <a href="/auth" className="shrink-0 rounded-full bg-[#d4af37] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#121214] hover:bg-[#f0d36b]">Sign In Free</a>
          </div>
        )}

        <div className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#fdfbf7]/30 mb-3">Trending on {platform}</p>
          <div className="flex flex-wrap gap-2">
            {(trends[platform] || trends["TikTok"]).map((t, i) => (
              <button key={i} onClick={() => setTopic(t)} className="border border-white/10 bg-[#121214] px-4 py-2 text-xs text-[#fdfbf7]/55 rounded-full hover:border-[#d4af37]/40 hover:text-[#fdfbf7] transition">{t}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-1.5 grid-cols-4 sm:grid-cols-8">
          {templates.map(t => (
            <button key={t.l} onClick={() => setTopic(t.t)} className="border border-white/10 bg-[#121214] px-2 py-3 text-center text-[11px] text-[#fdfbf7]/55 hover:border-[#d4af37]/50 hover:text-[#fdfbf7] rounded-xl transition">
              <span className="block text-lg mb-0.5">{t.e}</span>{t.l}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="border border-white/10 bg-[#121214] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><p className="text-xs uppercase tracking-[0.24em] text-[#fdfbf7]/48">Archive</p><p className="mt-1 text-lg font-semibold">Sessions</p></div>
              <button onClick={downloadTXT} className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#d4af37]">Download TXT</button>
            </div>
            <div className="mt-5 space-y-3 max-h-[400px] overflow-y-auto">
              {archive.map((item, i) => (
                <button key={item.id} onClick={() => setActiveId(item.id)}
                  className={`w-full border-l px-4 py-4 text-left transition ${item.id === activeId ? "border-[#d4af37] bg-[#1a2332] text-[#fdfbf7]" : "border-white/10 text-[#fdfbf7]/58 hover:border-[#d4af37]/60 hover:bg-white/[0.03]"}`}
                  style={{ marginLeft: `${Math.min(i, 3) * 10}px`, width: `calc(100% - ${Math.min(i, 3) * 10}px)` }}>
                  <span className="block text-xs uppercase tracking-[0.2em] text-[#d4af37]/80">{item.platform}</span>
                  <span className="mt-1 block font-medium text-sm truncate">{item.topic}</span>
                  <span className="mt-1 text-[10px] text-[#fdfbf7]/30">{item.mode}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="border border-white/10 bg-[#1a2332]/82 p-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={`mb-4 border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${dragOver ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/10 hover:border-white/20"}`}
              >
                {analyzing ? (
                  <p className="text-sm text-[#d4af37] animate-pulse">Analyzing image...</p>
                ) : (
                  <label className="cursor-pointer block">
                    <p className="text-sm text-[#fdfbf7]/35">Drop screenshot, video or audio</p>
                    <p className="text-[10px] text-[#fdfbf7]/18 mt-1">AI reads images & transcribes speech</p>
                    <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                )}
              </div>
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37]" htmlFor="topic">Video topic</label>
              <textarea id="topic" value={topic} onChange={e => setTopic(e.target.value)}
                className="mt-4 min-h-24 w-full resize-none border border-white/10 bg-[#121214] p-4 text-base leading-7 text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/30 focus:border-[#d4af37]/70"
                placeholder="Describe your video idea..." />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className="text-xs uppercase tracking-[0.2em] text-[#fdfbf7]/50">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} className="mt-3 w-full border border-white/10 bg-[#121214] px-4 py-3 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/70">{platforms.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label className="text-xs uppercase tracking-[0.2em] text-[#fdfbf7]/50">Style</label>
                  <select value={tone} onChange={e => setTone(e.target.value)} className="mt-3 w-full border border-white/10 bg-[#121214] px-4 py-3 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/70"><option value="cinematic">Cinematic</option><option value="contrarian">Contrarian</option><option value="urgent">Urgent</option></select></div>
              </div>
              <div className="mt-4 flex rounded-full border border-white/10 bg-[#121214] p-1">
                {(["hooks", "script", "series"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${mode === m ? "bg-[#d4af37] text-[#121214]" : "text-[#fdfbf7]/50"}`}>
                    {m === "hooks" ? "Hooks" : m === "script" ? "Script" : "Series 3cr"}
                  </button>
                ))}
              </div>
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
              <button onClick={handleGenerate} disabled={loading || (credits !== null && credits < cost)}
                className="mt-4 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] hover:bg-[#f0d36b] disabled:cursor-not-allowed disabled:bg-[#fdfbf7]/20 disabled:text-[#fdfbf7]/45">
                {loading ? "Generating..." : `Generate (${cost} credit${cost > 1 ? "s" : ""})`}
              </button>
            </div>

            <div className="border border-[#d4af37]/24 bg-[#121214] p-6 shadow-[0_0_60px_rgba(212,175,55,0.08)] overflow-y-auto max-h-[750px]">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div><p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Output</p><h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] line-clamp-2">{activeSet.topic}</h3></div>
                <span className="shrink-0 border border-white/10 px-3 py-2 text-xs text-[#fdfbf7]/58">{activeSet.platform}</span>
              </div>

              {activeSet.title && (
                <div className="mb-4 border border-white/10 bg-[#1a2332]/30 p-3 rounded-lg">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-1">Title</p>
                  <p className="text-base font-semibold">{activeSet.title}</p>
                  <button onClick={() => copyText(activeSet.title!)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === activeSet.title ? "Copied" : "Copy"}</button>
                </div>
              )}

              {activeSet.thumbnail && (
                <div className="mb-4 border border-[#d4af37]/20 bg-[#d4af37]/3 p-3 rounded-lg">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-1">Thumbnail Text</p>
                  <p className="text-xl font-bold text-[#d4af37]">{activeSet.thumbnail}</p>
                  <button onClick={() => copyText(activeSet.thumbnail!)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === activeSet.thumbnail ? "Copied" : "Copy"}</button>
                </div>
              )}

              {activeSet.mode === "script" && activeSet.hook ? (
                <div className="space-y-4">
                  <Block label="Hook" text={activeSet.hook.text} score={activeSet.hook.score} copied={copied} onCopy={copyText} hl />
                  {activeSet.body && <Block label="Body" text={activeSet.body} copied={copied} onCopy={copyText} />}
                  {activeSet.cta && <Block label="CTA" text={activeSet.cta} copied={copied} onCopy={copyText} hl />}
                  {activeSet.description && <Block label="Description" text={activeSet.description} copied={copied} onCopy={copyText} />}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSet.hooks?.map((h, i) => (
                    <div key={i} className="group border border-white/10 bg-[#1a2332]/58 p-4 transition hover:border-[#d4af37]/55">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-sm text-[#d4af37]">0{i + 1}</span>
                        <p className="flex-1 text-base leading-7 text-[#fdfbf7]/86">{h.text}</p>
                        <span className="shrink-0 text-xs font-bold text-[#d4af37]">{h.score}</span>
                      </div>
                      <button onClick={() => copyText(h.text)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 group-hover:text-[#f0d36b]">{copied === h.text ? "Copied" : "Copy"}</button>
                    </div>
                  ))}
                </div>
              )}

              {activeSet.hashtags && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-3">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSet.hashtags.map(t => (
                      <button key={t} onClick={() => copyText(t)} className="border border-[#d4af37]/20 bg-[#d4af37]/5 px-3 py-1.5 text-xs text-[#d4af37] rounded-full hover:bg-[#d4af37]/15">{copied === t ? "Copied!" : t}</button>
                    ))}
                  </div>
                </div>
              )}

              {activeSet.sound && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-2">Sound</p>
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

function Block({ label, text, score, copied, onCopy, hl }: { label: string; text: string; score?: number; copied: string; onCopy: (t: string) => void; hl?: boolean }) {
  return (
    <div className={`border p-4 ${hl ? "border-[#d4af37]/30 bg-[#d4af37]/3" : "border-white/10 bg-[#1a2332]/40"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">{label}</p>
        {score !== undefined && <span className="text-xs font-bold text-[#d4af37]">{score}</span>}
      </div>
      <p className={`leading-7 ${hl ? "text-lg text-[#fdfbf7]/90" : "text-sm text-[#fdfbf7]/74"}`}>{text}</p>
      <button onClick={() => onCopy(text)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === text ? "Copied" : "Copy"}</button>
    </div>
  );
}
