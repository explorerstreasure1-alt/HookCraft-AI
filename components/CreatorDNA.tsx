"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";
import { showToast } from "./Toast";

type VideoEntry = { hook: string; platform: string; views: number; likes: number; comments: number };

type DNAProfile = { label: string; value: string; insight: string };
type Pattern = { pattern: string; avg_views: number; count: number; example?: string; fix?: string };

type DNAResult = {
  profile: DNAProfile[];
  winning_patterns: Pattern[];
  losing_patterns: Pattern[];
  platform_breakdown: { platform: string; avg_views: number; best_pattern: string; count: number }[];
  audience_psychology: { trait: string; evidence: string; recommendation: string }[];
  best_time: string;
  overall_grade: string;
  dna_summary: string;
  credits?: number;
};

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];

function parseCSV(text: string): VideoEntry[] {
  const lines = text.trim().split("\n").filter(Boolean);
  const entries: VideoEntry[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map(s => s.trim());
    if (parts.length < 4) continue;
    const hook = parts[0];
    const platform = platforms.find(p => parts.some(x => x.toLowerCase().includes(p.toLowerCase()))) || "TikTok";
    const views = parseInt(parts.find(p => /^\d+$/.test(p.replace(/[,\s]/g, ""))) || "0") || parseInt(parts[parts.length - 3]?.replace(/[,\s]/g, "") || "0");
    const likes = parseInt(parts[parts.length - 2]?.replace(/[,\s]/g, "") || "0");
    const comments = parseInt(parts[parts.length - 1]?.replace(/[,\s]/g, "") || "0");
    if (hook && views > 0) entries.push({ hook, platform, views, likes, comments });
  }
  return entries;
}

export default function CreatorDNA() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "manual">("paste");
  const [csvText, setCsvText] = useState("");
  const [niche, setNiche] = useState("");
  const [manualVideos, setManualVideos] = useState<VideoEntry[]>([
    { hook: "", platform: platforms[0], views: 0, likes: 0, comments: 0 },
    { hook: "", platform: platforms[0], views: 0, likes: 0, comments: 0 },
    { hook: "", platform: platforms[0], views: 0, likes: 0, comments: 0 },
  ]);
  const [result, setResult] = useState<DNAResult | null>(null);

  // DNA-optimized generation
  const [genTopic, setGenTopic] = useState("");
  const [genPlatform, setGenPlatform] = useState(platforms[0]);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then((d: { credits: number }) => {
      if (d.credits !== undefined) setCredits(d.credits);
    }).catch(() => {});
    function onCredits(e: Event) { setCredits((e as CustomEvent).detail); }
    window.addEventListener("credits-updated", onCredits);
    return () => window.removeEventListener("credits-updated", onCredits);
  }, []);

  function updateCredits(c: number) { setCredits(c); window.dispatchEvent(new CustomEvent("credits-updated", { detail: c })); }

  function updateManual(idx: number, field: string, value: string | number) {
    setManualVideos(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  }
  function addManualSlot() { setManualVideos(prev => [...prev, { hook: "", platform: platforms[0], views: 0, likes: 0, comments: 0 }]); }
  function removeManualSlot(idx: number) {
    if (manualVideos.length <= 3) return;
    setManualVideos(prev => prev.filter((_, i) => i !== idx));
  }

  async function analyze() {
    const videos = inputMode === "paste" ? parseCSV(csvText) : manualVideos.filter(v => v.hook.trim() && v.views > 0);
    if (videos.length < 3) { setError("Need at least 3 videos with hook + views."); return; }
    if (!niche.trim()) { setError("Enter your niche."); return; }
    if (credits !== null && credits < 3) { setError("Need 3 credits for DNA analysis."); return; }
    setError(""); setLoading(true); setResult(null); setGenResult(null);
    try {
      const r = await fetch("/api/dna", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", videos, niche: niche.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setLoading(false); return; }
      setResult(d);
      if (d.credits !== undefined) updateCredits(d.credits);
      showToast("Your Creator DNA is ready!", "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function generateOptimized() {
    if (!genTopic.trim()) { setError("Enter a topic."); return; }
    if (!result) { setError("Analyze your DNA first."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setGenLoading(true); setGenResult(null);
    try {
      const r = await fetch("/api/dna", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate", topic: genTopic.trim(), platform: genPlatform,
          dna_profile: result.profile,
          winning_patterns: result.winning_patterns.map(p => p.pattern),
          audience_traits: result.audience_psychology.map(a => a.trait),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setGenLoading(false); return; }
      setGenResult(d);
      if (d.credits !== undefined) updateCredits(d.credits);
      showToast("DNA-optimized hooks ready!", "success");
    } catch { setError("Network error."); }
    finally { setGenLoading(false); }
  }

  const gradeColor = (g: string) => g.startsWith("A") ? "#4ade80" : g.startsWith("B") ? "#fbbf24" : g.startsWith("C") ? "#f0a040" : "#ef4444";

  return (
    <section id="dna" className="bg-[#0c0d10] px-4 py-20 text-[#fdfbf7] sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37] px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 animate-pulse">Beta</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.05em]">Creator DNA</h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-[#fdfbf7]/65">
            Upload your past video stats. AI builds your personal creator DNA profile — then generates hooks that YOUR specific audience will love.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Input panel */}
          <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5 space-y-4">
            {/* Input mode */}
            <div className="flex rounded-full border border-white/10 bg-[#121214] p-1">
              <button onClick={() => setInputMode("paste")} className={`flex-1 rounded-full py-2 text-[10px] font-semibold uppercase tracking-[0.1em] cursor-pointer ${inputMode==="paste"?"bg-[#d4af37] text-[#121214]":"text-[#fdfbf7]/40 hover:text-[#fdfbf7]/70"}`}>
                CSV Paste
              </button>
              <button onClick={() => setInputMode("manual")} className={`flex-1 rounded-full py-2 text-[10px] font-semibold uppercase tracking-[0.1em] cursor-pointer ${inputMode==="manual"?"bg-[#d4af37] text-[#121214]":"text-[#fdfbf7]/40 hover:text-[#fdfbf7]/70"}`}>
                Manual Entry
              </button>
            </div>

            {inputMode === "paste" ? (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Paste video stats</label>
                <p className="text-[8px] text-[#fdfbf7]/15 mt-0.5 mb-2">Format: <code className="text-[#d4af37]/40">hook text, platform, views, likes, comments</code> — one per line</p>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  className="min-h-[200px] w-full resize-none border border-white/10 bg-[#121214] p-3 text-[11px] leading-5 text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg font-mono"
                  rows={10}
                  placeholder={`Everyone lies about AI income, TikTok, 2300000, 185000, 4200&#10;My biggest mistake cost me $5000, TikTok, 890000, 72000, 1800&#10;How I made money online with zero followers, YouTube Shorts, 450000, 38000, 950&#10;Stop doing this in your 20s, Instagram Reels, 1200000, 98000, 3100`}
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {manualVideos.map((v, i) => (
                  <div key={i} className="border border-white/5 bg-[#121214] rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[#d4af37]/40">#{i + 1}</span>
                      {manualVideos.length > 3 && (
                        <button onClick={() => removeManualSlot(i)} className="text-[9px] text-zinc-600 hover:text-red-400 cursor-pointer">&times;</button>
                      )}
                    </div>
                    <input value={v.hook} onChange={e => updateManual(i, "hook", e.target.value)} placeholder="Hook text..." className="w-full border border-white/5 bg-[#0c0d10] px-2.5 py-1.5 text-[10px] text-[#fdfbf7] outline-none focus:border-[#d4af37]/30 rounded" />
                    <div className="grid grid-cols-4 gap-1.5">
                      <select value={v.platform} onChange={e => updateManual(i, "platform", e.target.value)} className="border border-white/5 bg-[#0c0d10] px-1.5 py-1 text-[9px] text-[#fdfbf7] outline-none rounded cursor-pointer">
                        {platforms.map(p => <option key={p} value={p}>{p.slice(0,4)}</option>)}
                      </select>
                      <input value={v.views || ""} onChange={e => updateManual(i, "views", Number(e.target.value))} placeholder="Views" type="number" className="border border-white/5 bg-[#0c0d10] px-1.5 py-1 text-[9px] text-[#fdfbf7] outline-none focus:border-[#d4af37]/30 rounded" />
                      <input value={v.likes || ""} onChange={e => updateManual(i, "likes", Number(e.target.value))} placeholder="Likes" type="number" className="border border-white/5 bg-[#0c0d10] px-1.5 py-1 text-[9px] text-[#fdfbf7] outline-none focus:border-[#d4af37]/30 rounded" />
                      <input value={v.comments || ""} onChange={e => updateManual(i, "comments", Number(e.target.value))} placeholder="Cmnts" type="number" className="border border-white/5 bg-[#0c0d10] px-1.5 py-1 text-[9px] text-[#fdfbf7] outline-none focus:border-[#d4af37]/30 rounded" />
                    </div>
                  </div>
                ))}
                <button onClick={addManualSlot} className="w-full border border-dashed border-white/10 rounded-lg p-2 text-[9px] text-[#fdfbf7]/20 hover:border-[#d4af37]/30 hover:text-[#d4af37]/40 transition cursor-pointer">
                  + Add video
                </button>
              </div>
            )}

            <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche (e.g. AI tools, fitness, coding)" className="w-full border border-white/10 bg-[#121214] px-3 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />

            {error && <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"><p className="text-xs text-red-400">{error}</p></div>}

            <button onClick={analyze} disabled={loading || (credits !== null && credits < 3)} className="gold-btn w-full px-6 py-3.5 text-xs cursor-pointer uppercase tracking-[0.12em]">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Analyzing DNA...</span> : "Analyze My DNA (3 credits)"}
            </button>
          </div>

          {/* Results panel */}
          <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 50px)" }}>
            {loading ? <div className="p-5 space-y-3">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-12 w-full" />)}</div>
            : !result ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center px-8">
                <div className="w-20 h-20 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-6">
                  <span className="text-3xl">🧬</span>
                </div>
                <p className="text-sm text-[#fdfbf7]/20 font-medium">Your Creator DNA Awaits</p>
                <p className="text-[11px] text-[#fdfbf7]/10 max-w-[300px] leading-relaxed mt-1">
                  ChatGPT can&apos;t know YOUR audience. Upload 3+ videos with stats. HookCraft builds a profile of what YOUR specific viewers love — then generates hooks engineered for THEM.
                </p>
                <div className="mt-6 space-y-2 text-left">
                  {[
                    { n: "1", t: "Paste your last 5-10 video hooks + stats" },
                    { n: "2", t: "AI finds your winning patterns" },
                    { n: "3", t: "Get audience psychology breakdown" },
                    { n: "4", t: "Generate hooks YOUR audience wants" },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full border border-[#d4af37]/20 flex items-center justify-center text-[9px] text-[#d4af37]/40 shrink-0">{s.n}</span>
                      <span className="text-[11px] text-[#fdfbf7]/12">{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {/* DNA Header */}
                <div className="sticky top-0 z-10 bg-[#121214]/95 backdrop-blur-sm border-b border-[#d4af37]/20 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧬</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-0.5">Creator DNA Profile</p>
                        <p className="text-xs text-[#fdfbf7]/40">{niche}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#fdfbf7]/20">Grade</span>
                      <span className="text-xl font-black" style={{ color: gradeColor(result.overall_grade) }}>{result.overall_grade}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#fdfbf7]/40 italic mt-2 leading-relaxed">{result.dna_summary}</p>
                </div>

                <div className="p-5 space-y-5">
                  {/* Profile insights */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Profile Insights</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.profile.map((p, i) => (
                        <div key={i} className="border border-white/5 bg-[#1a2332]/30 rounded-lg p-3">
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#d4af37]/60 mb-0.5">{p.label}</p>
                          <p className="text-xs font-semibold text-[#fdfbf7]">{p.value}</p>
                          <p className="text-[9px] text-[#fdfbf7]/25 mt-1 leading-relaxed">{p.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Winning vs Losing */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-green-400/80 mb-2">Winning Patterns</p>
                      <div className="space-y-1.5">
                        {result.winning_patterns.map((p, i) => (
                          <div key={i} className="border border-green-500/10 bg-green-500/3 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-[#fdfbf7]/80">{p.pattern}</span>
                              <span className="text-[9px] font-bold text-green-400">{p.avg_views >= 1000000 ? `${(p.avg_views/1000000).toFixed(1)}M` : p.avg_views >= 1000 ? `${(p.avg_views/1000).toFixed(0)}K` : p.avg_views} avg</span>
                            </div>
                            {p.example && <p className="text-[9px] text-[#fdfbf7]/30 italic">&ldquo;{p.example.slice(0,100)}&rdquo;</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/80 mb-2">Losing Patterns</p>
                      <div className="space-y-1.5">
                        {result.losing_patterns.map((p, i) => (
                          <div key={i} className="border border-red-500/10 bg-red-500/3 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-[#fdfbf7]/80">{p.pattern}</span>
                              <span className="text-[9px] font-bold text-red-400">{p.avg_views >= 1000 ? `${(p.avg_views/1000).toFixed(0)}K` : p.avg_views} avg</span>
                            </div>
                            <p className="text-[9px] text-[#fdfbf7]/30">Fix: {p.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Platform breakdown */}
                  {result.platform_breakdown.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">Platform Breakdown</p>
                      <div className="flex flex-wrap gap-2">
                        {result.platform_breakdown.map((pb, i) => (
                          <div key={i} className="border border-white/5 bg-[#1a2332]/30 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-[#fdfbf7] font-medium">{pb.platform}</p>
                            <p className="text-[8px] text-[#d4af37]/50 mt-0.5">
                              {pb.avg_views >= 1000000 ? `${(pb.avg_views/1000000).toFixed(1)}M` : `${(pb.avg_views/1000).toFixed(0)}K`} avg &middot; {pb.count} videos &middot; {pb.best_pattern}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audience psychology */}
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Audience Psychology</p>
                    <div className="space-y-2">
                      {result.audience_psychology.map((a, i) => (
                        <div key={i} className="border border-white/5 bg-[#1a2332]/20 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-[#fdfbf7]/70">{a.trait}</p>
                          <p className="text-[9px] text-[#fdfbf7]/30 mt-0.5">{a.evidence}</p>
                          <p className="text-[9px] text-[#d4af37]/50 mt-0.5">→ {a.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best time */}
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[9px] text-[#fdfbf7]/40 italic">{result.best_time}</p>
                  </div>

                  {/* Generate optimized section */}
                  <div className="border-t border-[#d4af37]/20 pt-5 mt-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#d4af37] mb-4">
                      Generate DNA-Optimized Hooks
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          value={genTopic}
                          onChange={e => setGenTopic(e.target.value)}
                          placeholder="Enter a new topic..."
                          className="flex-1 border border-white/10 bg-[#1a2332]/50 px-3 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg"
                        />
                        <select value={genPlatform} onChange={e => setGenPlatform(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
                          {platforms.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <button onClick={generateOptimized} disabled={genLoading || !genTopic.trim()} className="gold-btn w-full px-6 py-3 text-xs cursor-pointer uppercase tracking-[0.12em]">
                        {genLoading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Generating...</span> : "Generate DNA-Optimized Hooks (1 credit)"}
                      </button>
                    </div>

                    {genResult?.hooks?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {genResult.hooks.map((h: any, i: number) => (
                          <div key={i} className="group border border-[#d4af37]/15 bg-[#1a2332]/30 rounded-lg p-3.5 hover:border-[#d4af37]/30 transition">
                            <div className="flex items-start gap-3">
                              <span className="font-mono text-[10px] text-[#d4af37] shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                              <p className="flex-1 text-xs leading-5 text-[#fdfbf7]/85">{h.text}</p>
                              <span className="shrink-0 text-[10px] font-bold text-[#d4af37]">{h.score}</span>
                            </div>
                            <p className="text-[9px] text-[#d4af37]/30 mt-1.5 ml-6">{h.why}</p>
                            <button onClick={() => { navigator.clipboard.writeText(h.text); showToast("Copied!", "success"); }} className="mt-1.5 ml-6 text-[9px] uppercase tracking-[0.12em] text-[#d4af37]/20 group-hover:text-[#d4af37]/60 transition cursor-pointer">Copy</button>
                          </div>
                        ))}
                        {genResult.title && <div className="border border-white/5 rounded-lg p-3 mt-3">
                          <span className="text-[9px] text-[#d4af37]/40">Title: </span>
                          <span className="text-[10px] text-[#fdfbf7]/60">{genResult.title}</span>
                        </div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
