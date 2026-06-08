"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "./Toast";

type HookItem = { text: string; score: number };

type ResultSet = {
  id: number; topic: string; platform: string; mode: string;
  hooks?: HookItem[]; title?: string; hashtags?: string[]; thumbnail?: string;
  hook?: HookItem; body?: string; cta?: string; description?: string; sound?: string;
  created: string;
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

const sample: ResultSet = { id: 101, topic: "AI side hustle myth", platform: "YouTube Shorts", mode: "hooks", hooks: [{ text: "Everyone sells the AI dream but nobody shows this part", score: 87 }], title: "The AI Side Hustle Myth", hashtags: ["#ai", "#truth"], thumbnail: "AI EXPOSED", created: new Date().toISOString() };

async function extractAudio(file: File): Promise<string> {
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  const duration = Math.min(audioBuffer.duration, 300);
  const sampleCount = Math.floor(duration * 16000);
  const offlineCtx = new OfflineAudioContext(1, sampleCount, 16000);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, 0, duration);
  const rendered = await offlineCtx.startRendering();
  audioCtx.close();
  const wav = encodeWAV(rendered);
  const bytes = new Uint8Array(wav);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function encodeWAV(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitsPerSample = 16;
  const data = buffer.getChannelData(0);
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = data.length * (bitsPerSample / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wav = new ArrayBuffer(totalSize);
  const view = new DataView(wav);
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  return wav;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function buildFullText(s: ResultSet): string {
  const parts: string[] = [];
  parts.push(`HookCraft AI - ${s.platform} - ${s.topic}`);
  parts.push("=".repeat(50));
  if (s.title) parts.push(`TITLE: ${s.title}`);
  if (s.thumbnail) parts.push(`THUMBNAIL: ${s.thumbnail}`);
  if (s.mode === "script" && s.hook) {
    parts.push(`HOOK: ${s.hook.text} (score: ${s.hook.score})`);
    if (s.body) parts.push(`BODY:\n${s.body}`);
    if (s.cta) parts.push(`CTA: ${s.cta}`);
    if (s.description) parts.push(`DESCRIPTION:\n${s.description}`);
  } else if (s.hooks) {
    parts.push("HOOKS:");
    s.hooks.forEach((h, i) => parts.push(`  ${i + 1}. ${h.text} (score: ${h.score})`));
  }
  if (s.hashtags) parts.push(`HASHTAGS: ${s.hashtags.join(" ")}`);
  if (s.sound) parts.push(`SOUND: ${s.sound}`);
  return parts.join("\n\n");
}

export default function HookGenerator() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState("cinematic");
  const [mode, setMode] = useState<"hooks" | "script" | "series">("hooks");
  const [credits, setCredits] = useState<number | null>(null);
  const [archive, setArchive] = useState<ResultSet[]>([sample]);
  const [activeId, setActiveId] = useState(sample.id);
  const [copiedId, setCopiedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const prevCredits = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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
        id: Date.now(), topic: topic.trim(), platform, mode: d.mode, created: new Date().toISOString(),
        hooks: d.hooks, title: d.title, hashtags: d.hashtags, thumbnail: d.thumbnail,
        hook: d.hook, body: d.body, cta: d.cta, description: d.description, sound: d.sound,
      };
      setArchive(c => [next, ...c].slice(0, 15));
      setActiveId(next.id);
      if (d.credits !== undefined) setCredits(d.credits);
      setSessionCount(s => s + 1);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1500);
    } catch {
      showToast("Copy failed", "info");
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(buildFullText(activeSet));
      setCopiedAll(true);
      showToast("All copied!", "success");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showToast("Copy failed", "info");
    }
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result as string }) });
        const d = await r.json();
        if (d.topic) { setTopic(d.topic); showToast("Screenshot analyzed!", "success"); }
      } catch { setError("Analysis failed."); }
      finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
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
    const blob = new Blob([buildFullText(activeSet)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hookcraft-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const cost = mode === "series" ? 3 : 1;
  const hasOutput = activeSet.hooks?.length || activeSet.hook;

  return (
    <section id="dashboard" className="bg-[#0c0d10] px-4 py-20 text-[#fdfbf7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Creator dashboard</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.05em]">Hooks, scripts, hashtags, thumbnails, series.</h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-[#fdfbf7]/65">{user ? "Everything you need to post. Powered by AI." : "Guest mode. Sign in to save credits."}</p>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="relative overflow-hidden rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#1a2332] to-[#0f151c] p-4 sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.06),transparent_60%)]" />
              <p className="relative text-[9px] uppercase tracking-[0.2em] text-[#d4af37]/50 mb-2">Credits</p>
              <div className="relative flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-[#d4af37]">{credits !== null ? credits : "..."}</span>
              </div>
              <div className="relative mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d36b] transition-all duration-700" style={{ width: `${credits !== null ? Math.min(100, Math.max(0, (credits / 10) * 100)) : 0}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#121214]/50 p-4 sm:p-5 flex flex-col justify-center items-center">
              <span className="text-3xl sm:text-4xl font-bold text-[#fdfbf7]/40">{archive.length - 1}</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#fdfbf7]/25">generated</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#121214]/50 p-4 sm:p-5 flex flex-col justify-center items-center">
              <span className="text-3xl sm:text-4xl font-bold text-[#d4af37]/55">{sessionCount}</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#d4af37]/30">this session</span>
            </div>
            {credits !== null && credits < cost ? (
              <a href="#pricing" className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-4 sm:p-5 flex flex-col justify-center items-center hover:bg-[#d4af37]/10 transition group cursor-pointer">
                <span className="text-2xl font-bold text-[#d4af37] group-hover:scale-110 transition">+</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#d4af37]/60">Buy credits</span>
              </a>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#121214]/50 p-4 sm:p-5 flex flex-col justify-center items-center">
                <span className="text-2xl font-bold text-[#fdfbf7]/25">{cost}</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#fdfbf7]/20">cost / gen</span>
              </div>
            )}
          </div>
        </div>

        {/* Guest banner */}
        {!user && (
          <div className="mt-6 border border-[#d4af37]/20 bg-[#1a2332]/50 p-4 rounded-xl flex items-center justify-between gap-3 flex-col sm:flex-row">
            <p className="text-sm text-[#fdfbf7]/65">Guest mode. Sign in for cross-device access and saved history.</p>
            <a href="/auth" className="shrink-0 rounded-full bg-[#d4af37] px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#121214] hover:bg-[#f0d36b] transition cursor-pointer">Sign In Free</a>
          </div>
        )}

        {/* Trending topics */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#fdfbf7]/25 mb-2.5">Trending on {platform}</p>
          <div className="flex flex-wrap gap-1.5">
            {(trends[platform] || trends["TikTok"]).map((t, i) => (
              <button key={i} onClick={() => setTopic(t)} className="border border-white/10 bg-[#121214] px-3.5 py-2 text-xs text-[#fdfbf7]/50 rounded-full hover:border-[#d4af37]/35 hover:text-[#fdfbf7] transition cursor-pointer">{t}</button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="mt-3 grid gap-1.5 grid-cols-4 sm:grid-cols-8">
          {templates.map(t => (
            <button key={t.l} onClick={() => setTopic(t.t)} className="border border-white/10 bg-[#121214] px-2 py-2.5 text-center text-[10px] text-[#fdfbf7]/50 hover:border-[#d4af37]/40 hover:text-[#fdfbf7] rounded-xl transition cursor-pointer">
              <span className="block text-base mb-0.5">{t.e}</span>{t.l}
            </button>
          ))}
        </div>

        {/* Main content: archive + (input + output) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Archive sidebar */}
          <aside className="border border-white/10 bg-[#121214] rounded-xl p-4 order-2 lg:order-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#fdfbf7]/40">Archive</p>
                <p className="mt-0.5 text-base font-semibold">History</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadTXT} className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/50 hover:text-[#d4af37] transition cursor-pointer">TXT</button>
                <button onClick={() => { setArchive([sample]); setActiveId(sample.id); }} className="text-[10px] text-zinc-600 hover:text-red-400 transition cursor-pointer">Clear</button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {archive.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border-l-2 transition cursor-pointer ${
                    item.id === activeId
                      ? "border-[#d4af37] bg-[#1a2332] text-[#fdfbf7]"
                      : "border-transparent text-[#fdfbf7]/50 hover:border-white/10 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/70">{item.platform}</span>
                  <span className="mt-0.5 block text-xs font-medium truncate">{item.topic}</span>
                  <span className="mt-0.5 text-[9px] text-[#fdfbf7]/18">{item.mode} · {new Date(item.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </button>
              ))}
              {archive.length === 1 && archive[0].id === sample.id && (
                <p className="text-[10px] text-[#fdfbf7]/10 text-center py-8">Generate your first hook</p>
              )}
            </div>
          </aside>

          {/* Input + Output panel */}
          <div className="order-1 lg:order-2 grid grid-cols-1 xl:grid-cols-[1fr_1.25fr] gap-5">
            {/* Input form */}
            <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={`mb-4 border-2 border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                  analyzing ? "border-[#d4af37] bg-[#d4af37]/5 pointer-events-none" :
                  dragOver ? "border-[#d4af37] bg-[#d4af37]/5" :
                  "border-white/10 hover:border-white/20"
                }`}
              >
                {analyzing ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-[#d4af37]">Analyzing...</p>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <p className="text-xs text-[#fdfbf7]/30">Drop screenshot or paste to fill topic</p>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                )}
              </div>

              {/* Topic */}
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]" htmlFor="topic">Video topic</label>
              <textarea
                id="topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="mt-2 min-h-[100px] w-full resize-none border border-white/10 bg-[#121214] p-3.5 text-sm leading-6 text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/25 focus:border-[#d4af37]/60 rounded-xl transition"
                placeholder="Describe your video idea..."
              />

              {/* Quick fills */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {["How I made $1000 online", "My biggest mistake", "Why everyone is wrong about AI"].map(t => (
                  <button key={t} onClick={() => setTopic(t)} className="text-[10px] text-zinc-500 hover:text-[#d4af37] bg-zinc-800/30 px-2.5 py-1 rounded-full transition cursor-pointer">{t}</button>
                ))}
              </div>

              {/* Platform / Style */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/45">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} className="mt-2 w-full border border-white/10 bg-[#121214] px-3.5 py-2.5 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/60 rounded-lg cursor-pointer">
                    {platforms.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/45">Style</label>
                  <select value={tone} onChange={e => setTone(e.target.value)} className="mt-2 w-full border border-white/10 bg-[#121214] px-3.5 py-2.5 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/60 rounded-lg cursor-pointer">
                    <option value="cinematic">Cinematic</option>
                    <option value="contrarian">Contrarian</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Mode switcher */}
              <div className="mt-4 flex rounded-full border border-white/10 bg-[#121214] p-1">
                {(["hooks", "script", "series"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] transition cursor-pointer ${
                      mode === m ? "bg-[#d4af37] text-[#121214]" : "text-[#fdfbf7]/45 hover:text-[#fdfbf7]/70"
                    }`}
                  >
                    {m === "hooks" ? "Hooks" : m === "script" ? "Script" : "Series"}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || (credits !== null && credits < cost)}
                className="gold-btn w-full mt-4 px-6 py-3.5 text-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  `Generate (${cost} credit${cost > 1 ? "s" : ""})`
                )}
              </button>
            </div>

            {/* Output panel */}
            <div
              ref={outputRef}
              id="output-panel"
              className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden flex flex-col"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              {loading ? (
                <div className="p-5 space-y-4">
                  <div className="skeleton h-7 w-2/3" />
                  <div className="skeleton h-5 w-1/3" />
                  <div className="space-y-3 mt-4">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
                  </div>
                </div>
              ) : !hasOutput ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                  <div className="w-14 h-14 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d4af37]/30">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[#fdfbf7]/20 font-medium mb-1">No output yet</p>
                  <p className="text-[11px] text-[#fdfbf7]/10">Enter a topic and click Generate</p>
                </div>
              ) : (
                <>
                  {/* Output header */}
                  <div className="shrink-0 flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#d4af37] mb-1">Output</p>
                      <h3 className="text-sm font-semibold tracking-[-0.02em] truncate">{activeSet.topic}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={copyAll}
                        className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] rounded-lg transition cursor-pointer ${
                          copiedAll
                            ? "border-[#d4af37]/40 text-[#d4af37] bg-[#d4af37]/10"
                            : "border-white/10 text-[#fdfbf7]/35 hover:text-[#d4af37] hover:border-[#d4af37]/30"
                        }`}
                      >
                        {copiedAll ? "Copied!" : "Copy All"}
                      </button>
                      <span className="border border-white/10 px-2.5 py-1.5 text-[10px] text-[#fdfbf7]/40 rounded-lg shrink-0">{activeSet.platform}</span>
                    </div>
                  </div>

                  {/* Output body - scrollable */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Title */}
                    {activeSet.title && (
                      <OutputBlock onCopy={() => copyText(activeSet.title!, `title-${activeSet.id}`)} copied={copiedId === `title-${activeSet.id}`}>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1.5">Title</p>
                        <p className="text-sm font-semibold text-[#fdfbf7] break-words">{activeSet.title}</p>
                      </OutputBlock>
                    )}

                    {/* Thumbnail */}
                    {activeSet.thumbnail && (
                      <OutputBlock onCopy={() => copyText(activeSet.thumbnail!, `thumb-${activeSet.id}`)} copied={copiedId === `thumb-${activeSet.id}`} highlight>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1.5">Thumbnail</p>
                        <p className="text-lg font-bold text-[#d4af37] break-words">{activeSet.thumbnail}</p>
                      </OutputBlock>
                    )}

                    {/* Script mode */}
                    {activeSet.mode === "script" && activeSet.hook ? (
                      <>
                        <OutputBlock onCopy={() => copyText(activeSet.hook!.text, `hook-${activeSet.id}`)} copied={copiedId === `hook-${activeSet.id}`} highlight>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]">Hook</p>
                            <span className="text-[10px] font-bold text-[#d4af37]">{activeSet.hook.score}</span>
                          </div>
                          <p className="text-base leading-7 text-[#fdfbf7]/90 break-words">{activeSet.hook.text}</p>
                        </OutputBlock>
                        {activeSet.body && (
                          <OutputBlock onCopy={() => copyText(activeSet.body!, `body-${activeSet.id}`)} copied={copiedId === `body-${activeSet.id}`}>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1.5">
                              Body · ~{Math.ceil(activeSet.body.split(" ").length / 3)}s read
                            </p>
                            <p className="text-sm leading-7 text-[#fdfbf7]/70 break-words whitespace-pre-wrap">{activeSet.body}</p>
                          </OutputBlock>
                        )}
                        {activeSet.cta && (
                          <OutputBlock onCopy={() => copyText(activeSet.cta!, `cta-${activeSet.id}`)} copied={copiedId === `cta-${activeSet.id}`} highlight>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1.5">CTA</p>
                            <p className="text-sm font-semibold text-[#fdfbf7]/90 break-words">{activeSet.cta}</p>
                          </OutputBlock>
                        )}
                        {activeSet.description && (
                          <OutputBlock onCopy={() => copyText(activeSet.description!, `desc-${activeSet.id}`)} copied={copiedId === `desc-${activeSet.id}`}>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1.5">Description</p>
                            <p className="text-sm leading-6 text-[#fdfbf7]/65 break-words whitespace-pre-wrap">{activeSet.description}</p>
                          </OutputBlock>
                        )}
                      </>
                    ) : (
                      /* Hooks list */
                      activeSet.hooks?.map((h, i) => (
                        <div key={i} className="group border border-white/8 bg-[#1a2332]/50 rounded-lg p-4 transition hover:border-[#d4af37]/40">
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs text-[#d4af37] shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                            <p className="flex-1 text-sm leading-6 text-[#fdfbf7]/85 break-words">{h.text}</p>
                            <span className="shrink-0 text-[11px] font-bold text-[#d4af37]">{h.score}</span>
                          </div>
                          <button
                            onClick={() => copyText(h.text, `hook-${activeSet.id}-${i}`)}
                            className={`mt-2 text-[10px] uppercase tracking-[0.15em] transition cursor-pointer ${
                              copiedId === `hook-${activeSet.id}-${i}`
                                ? "text-[#d4af37]"
                                : "text-[#d4af37]/40 group-hover:text-[#d4af37]"
                            }`}
                          >
                            {copiedId === `hook-${activeSet.id}-${i}` ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ))
                    )}

                    {/* Hashtags */}
                    {activeSet.hashtags && activeSet.hashtags.length > 0 && (
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2.5">Hashtags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSet.hashtags.map(t => (
                            <button
                              key={t}
                              onClick={() => copyText(t, `tag-${t}`)}
                              className={`border px-3 py-1 text-[11px] rounded-full transition cursor-pointer ${
                                copiedId === `tag-${t}`
                                  ? "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]"
                                  : "border-[#d4af37]/15 bg-[#d4af37]/3 text-[#d4af37]/70 hover:bg-[#d4af37]/10"
                              }`}
                            >
                              {copiedId === `tag-${t}` ? "Copied!" : t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sound */}
                    {activeSet.sound && (
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1.5">Sound</p>
                        <p className="text-sm text-[#fdfbf7]/55 italic break-words">&ldquo;{activeSet.sound}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutputBlock({
  children,
  onCopy,
  copied,
  highlight,
}: {
  children: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`relative rounded-lg p-3.5 transition group ${
      highlight
        ? "border border-[#d4af37]/20 bg-[#d4af37]/3"
        : "border border-white/8 bg-[#1a2332]/30"
    }`}>
      {children}
      <button
        onClick={onCopy}
        className={`absolute top-3 right-3 text-[10px] uppercase tracking-[0.12em] transition cursor-pointer ${
          copied ? "text-[#d4af37]" : "text-[#d4af37]/30 group-hover:text-[#d4af37]/70"
        }`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
