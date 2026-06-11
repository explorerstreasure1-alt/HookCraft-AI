"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";
import { showToast } from "./Toast";

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];
const tones = ["cinematic", "contrarian", "urgent"] as const;
const tabLabels = ["Retention Lab", "Content Factory", "Funnel Builder", "Cross-Niche", "Preflight"] as const;
type Tab = (typeof tabLabels)[number];

export default function PowerLab() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("Retention Lab");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then((d: { credits: number }) => {
      if (d.credits !== undefined) setCredits(d.credits);
    }).catch(() => {});
    function onCredits(e: Event) { setCredits((e as CustomEvent).detail); }
    window.addEventListener("credits-updated", onCredits);
    return () => window.removeEventListener("credits-updated", onCredits);
  }, []);

  function updateCredits(c: number) { setCredits(c); window.dispatchEvent(new CustomEvent("credits-updated", { detail: c })); }

  return (
    <section id="powerlab" className="bg-[#0c0d10] px-4 py-20 text-[#fdfbf7] sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37] px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 animate-pulse">Pro Lab</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.05em]">PowerLab</h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-[#fdfbf7]/65">
            Retention engineering, multi-platform factory, sales funnels, cross-niche adaptation, pre-publish QA.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-0">
          {tabLabels.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] border-b-2 transition cursor-pointer ${
                tab === t ? "border-[#d4af37] text-[#d4af37]" : "border-transparent text-[#fdfbf7]/30 hover:text-[#fdfbf7]/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 max-w-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-6">
          {tab === "Retention Lab" && <RetentionLab credits={credits} loading={loading} setLoading={setLoading} setError={setError} updateCredits={updateCredits} />}
          {tab === "Content Factory" && <ContentFactory credits={credits} loading={loading} setLoading={setLoading} setError={setError} updateCredits={updateCredits} />}
          {tab === "Funnel Builder" && <FunnelLab credits={credits} loading={loading} setLoading={setLoading} setError={setError} updateCredits={updateCredits} />}
          {tab === "Cross-Niche" && <CrossNicheLab credits={credits} loading={loading} setLoading={setLoading} setError={setError} updateCredits={updateCredits} />}
          {tab === "Preflight" && <PreflightLab credits={credits} loading={loading} setLoading={setLoading} setError={setError} updateCredits={updateCredits} />}
        </div>
      </div>
    </section>
  );
}

/* ─── Retention Lab ─── */
function RetentionLab({ credits, loading, setLoading, setError, updateCredits }: LabProps) {
  const [script, setScript] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!script.trim()) { setError("Paste a script to analyze."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/retention", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ script: script.trim(), platform }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setLoading(false); return; }
      setResult(d);
      if (d.credits !== undefined) updateCredits(d.credits);
      showToast("Analysis complete!", "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Paste script</label>
          <textarea value={script} onChange={e => setScript(e.target.value)} className="mt-2 min-h-[160px] w-full resize-none border border-white/10 bg-[#121214] p-3 text-xs leading-5 text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg transition" placeholder="Paste your full video script..." />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/45">Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="mt-1.5 w-full border border-white/10 bg-[#121214] px-3 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
            {platforms.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={loading} className="gold-btn w-full px-6 py-3 text-xs cursor-pointer uppercase tracking-[0.12em]">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Analyzing...</span> : "Analyze (1 credit)"}
        </button>
      </div>

      <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {loading ? <div className="p-5 space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="skeleton h-10 w-full" />)}</div>
        : !result ? <EmptyState title="Retention Engineering" desc="Paste a script. AI predicts retention curve, finds drop-off points, maps emotions, plans B-roll, and finds the best sponsor spot." />
        : <div className="overflow-y-auto p-5 space-y-5">
          {/* Retention curve */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Retention Curve</p>
            <div className="h-28 flex items-end gap-px">
              {result.curve?.map((c: any, i: number) => {
                const color = c.retention > 70 ? "#4ade80" : c.retention > 40 ? "#fbbf24" : "#ef4444";
                return <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${c.second}s: ${c.retention}% — ${c.note}`}>
                  <span className="text-[7px] text-white/30">{c.retention}%</span>
                  <div className="w-full rounded-t-sm transition-all duration-1000" style={{ height: `${c.retention}%`, background: color, minHeight: 2 }} />
                  <span className="text-[6px] text-white/15">{c.second}s</span>
                </div>;
              })}
            </div>
          </div>

          {/* Drop-offs */}
          {result.dropoffs?.length > 0 && <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/80 mb-2">Drop-Off Points</p>
            {result.dropoffs.map((d: any, i: number) => (
              <div key={i} className="border border-red-500/10 bg-red-500/3 rounded-lg p-3 mb-1.5">
                <span className="text-[10px] font-bold text-red-400">00:{String(d.second).padStart(2,"0")}s</span>
                <p className="text-[10px] text-[#fdfbf7]/50 mt-0.5">{d.issue}</p>
                <p className="text-[10px] text-green-400/70 mt-0.5">Fix: {d.fix}</p>
              </div>
            ))}
          </div>}

          {/* Emotion map + B-roll in 2-col */}
          <div className="grid gap-4 sm:grid-cols-2">
            {result.emotion_map?.length > 0 && <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">Emotion Map</p>
              <div className="space-y-1.5">
                {result.emotion_map.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] text-white/20 w-8">{e.second}s</span>
                    <span className="text-[9px] text-[#fdfbf7]/60 w-16">{e.emotion}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#d4af37]" style={{width:`${e.intensity}%`}} /></div>
                    <span className="text-[8px] text-white/30 w-6">{e.intensity}</span>
                  </div>
                ))}
              </div>
            </div>}
            {result.broll_plan?.length > 0 && <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">B-Roll Plan</p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {result.broll_plan.map((b: any, i: number) => (
                  <div key={i} className="border border-white/5 rounded p-2">
                    <span className="text-[8px] text-[#d4af37]/50">00:{String(b.second).padStart(2,"0")}s</span>
                    <p className="text-[9px] text-[#fdfbf7]/40 italic mt-0.5">&ldquo;{b.sentence?.slice(0,60)}&rdquo;</p>
                    <p className="text-[9px] text-[#fdfbf7]/25 mt-0.5">{b.visual}</p>
                  </div>
                ))}
              </div>
            </div>}
          </div>

          {/* Readability */}
          {result.readability && <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">Readability <span className="font-bold ml-1">{result.readability.score}/100</span></p>
            <p className="text-[10px] text-[#fdfbf7]/40">Issues: {result.readability.issues}</p>
            <p className="text-[10px] text-[#fdfbf7]/40 mt-1">Tips: {result.readability.tips}</p>
          </div>}

          {/* Sponsor */}
          {result.sponsor_best_spot?.second > 0 && <div className="border-t border-[#d4af37]/20 pt-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">Best Sponsor Spot</p>
            <div className="border border-[#d4af37]/15 bg-[#d4af37]/3 rounded-lg p-3">
              <span className="text-xs font-bold text-[#d4af37]">00:{String(result.sponsor_best_spot.second).padStart(2,"0")}s</span>
              <p className="text-[10px] text-[#fdfbf7]/50 mt-1">{result.sponsor_best_spot.reason}</p>
              <p className="text-[10px] text-[#fdfbf7]/35 italic mt-1">Transition: &ldquo;{result.sponsor_best_spot.transition}&rdquo;</p>
            </div>
          </div>}
        </div>}
      </div>
    </div>
  );
}

/* ─── Content Factory ─── */
function ContentFactory({ credits, loading, setLoading, setError, updateCredits }: LabProps) {
  const [mode, setMode] = useState<"platforms" | "variations" | "calendar">("platforms");
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState<string>(tones[0]);
  const [days, setDays] = useState(7);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (mode === "calendar" && !niche.trim()) { setError("Enter your niche."); return; }
    if (mode !== "calendar" && !topic.trim()) { setError("Enter a topic."); return; }
    const cost = mode === "calendar" ? 2 : 1;
    if (credits !== null && credits < cost) { setError(`Need ${cost} credit${cost>1?'s':''}.`); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const body: any = { action: mode, topic: topic.trim(), platform, tone, niche: niche.trim(), days };
      const r = await fetch("/api/factory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setLoading(false); return; }
      setResult(d);
      if (d.credits !== undefined) updateCredits(d.credits);
      showToast("Generated!", "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5 space-y-4">
        {/* Mode picker */}
        <div className="flex rounded-full border border-white/10 bg-[#121214] p-1">
          {(["platforms", "variations", "calendar"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }} className={`flex-1 rounded-full py-2 text-[9px] font-semibold uppercase tracking-[0.1em] cursor-pointer ${mode===m?"bg-[#d4af37] text-[#121214]":"text-[#fdfbf7]/40 hover:text-[#fdfbf7]/70"}`}>
              {m==="platforms"?"5 Platform":m==="variations"?"10 Variant":"Takvim"}
            </button>
          ))}
        </div>

        {mode === "calendar" ? (
          <>
            <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Niche (fitness, startup, coding...)" className="w-full border border-white/10 bg-[#121214] px-3 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />
            <div className="flex gap-2">
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="flex-1 border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
                {platforms.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
                {[7,14,21,30].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <textarea value={topic} onChange={e => setTopic(e.target.value)} className="min-h-[100px] w-full resize-none border border-white/10 bg-[#121214] p-3 text-xs leading-5 text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" placeholder="Your topic or idea..." />
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
                {platforms.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={tone} onChange={e => setTone(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
                {tones.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}

        <button onClick={run} disabled={loading} className="gold-btn w-full px-6 py-3 text-xs cursor-pointer uppercase tracking-[0.12em]">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Working...</span>
          : `${mode==="platforms"?"Generate 5 Platforms (1)":mode==="variations"?"Generate 10 Variations (1)":"Generate Calendar (2)"}`}
        </button>
      </div>

      <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {loading ? <div className="p-5 space-y-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-12 w-full" />)}</div>
        : !result ? <EmptyState title="Content Factory" desc="One topic → 5 platforms. One topic → 10 variations. One niche → 30-day calendar." />
        : <div className="overflow-y-auto p-5 space-y-3">
          {mode === "platforms" && result.platforms?.map((p: any, i: number) => (
            <div key={i} className="border border-white/8 bg-[#1a2332]/30 rounded-lg p-3.5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-1">{p.platform}</p>
              <p className="text-xs font-semibold text-[#fdfbf7]">&ldquo;{p.hook}&rdquo;</p>
              <p className="text-[10px] text-[#fdfbf7]/40 mt-1 leading-relaxed">{p.script?.slice(0,200)}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">{p.hashtags?.map((t:string,j:number)=><span key={j} className="text-[8px] text-[#d4af37]/40">{t}</span>)}</div>
            </div>
          ))}
          {mode === "variations" && result.variations?.map((v: any, i: number) => (
            <div key={i} className="border border-white/8 bg-[#1a2332]/30 rounded-lg p-3 flex items-start gap-3">
              <span className="text-[9px] font-bold text-[#d4af37]/50 w-28 shrink-0">{v.pattern}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#fdfbf7]/75">&ldquo;{v.hook}&rdquo;</p>
              </div>
              <span className="text-[10px] font-bold text-[#d4af37] shrink-0">{v.score}</span>
            </div>
          ))}
          {mode === "calendar" && result.days?.map((d: any, i: number) => (
            <div key={i} className="border border-white/8 bg-[#1a2332]/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#d4af37] shrink-0">Day {d.day}</span>
                <span className="text-[10px] text-[#fdfbf7]/50 truncate">{d.topic}</span>
              </div>
              <p className="text-[11px] text-[#fdfbf7]/65">&ldquo;{d.hook}&rdquo;</p>
              <div className="flex flex-wrap gap-1 mt-1">{d.hashtags?.map((t:string,j:number)=><span key={j} className="text-[8px] text-[#d4af37]/35">{t}</span>)}</div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

/* ─── Funnel Builder ─── */
function FunnelLab({ credits, loading, setLoading, setError, updateCredits }: LabProps) {
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState<string>(tones[0]);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!product.trim()) { setError("Enter a product or service."); return; }
    if (credits !== null && credits < 2) { setError("Need 2 credits."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/funnel", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ product: product.trim(), platform, tone }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setLoading(false); return; }
      setResult(d); if (d.credits!==undefined) updateCredits(d.credits);
      showToast("Funnel ready!", "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  const stageIcons = ["👁", "🤝", "🔥", "💰"];
  const stageColors = ["#60b0e0","#50c878","#f0a040","#d4af37"];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5 space-y-4">
        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Your product or service</label>
        <input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Online fitness coaching" className="w-full border border-white/10 bg-[#121214] px-3 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
            {platforms.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={tone} onChange={e => setTone(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
            {tones.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={loading} className="gold-btn w-full px-6 py-3 text-xs cursor-pointer uppercase tracking-[0.12em]">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Building...</span> : "Build Funnel (2 credits)"}
        </button>
      </div>

      <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {loading ? <div className="p-5 space-y-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-20 w-full" />)}</div>
        : !result ? <EmptyState title="Sales Funnel" desc="Enter your product. AI builds a 4-video funnel: Awareness → Trust → Urgency → Conversion." />
        : <div className="overflow-y-auto p-5 space-y-4">
          {result.stages?.map((s: any, i: number) => (
            <div key={i} className="rounded-xl p-4 border" style={{ borderColor: `${stageColors[i]}33`, background: `${stageColors[i]}08` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stageIcons[i]}</span>
                <div>
                  <p className="text-xs font-bold text-[#fdfbf7]">Stage {s.number}: {s.stage}</p>
                  <p className="text-[9px] text-[#fdfbf7]/30">{s.goal}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="border border-white/5 rounded-lg p-2.5">
                  <p className="text-[9px] text-[#d4af37]/60 uppercase mb-0.5">Hook</p>
                  <p className="text-[11px] text-[#fdfbf7]/75">&ldquo;{s.hook}&rdquo;</p>
                </div>
                <div className="border border-white/5 rounded-lg p-2.5">
                  <p className="text-[9px] text-[#d4af37]/60 uppercase mb-0.5">Script</p>
                  <p className="text-[10px] text-[#fdfbf7]/50 leading-relaxed">{s.script}</p>
                </div>
                <div className="border border-white/5 rounded-lg p-2.5" style={{ borderColor: `${stageColors[i]}44` }}>
                  <p className="text-[9px] text-[#d4af37]/60 uppercase mb-0.5">CTA</p>
                  <p className="text-[10px] font-semibold text-[#fdfbf7]/80">{s.cta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

/* ─── Cross-Niche Lab ─── */
function CrossNicheLab({ credits, loading, setLoading, setError, updateCredits }: LabProps) {
  const [sourceNiche, setSourceNiche] = useState("");
  const [targetNiche, setTargetNiche] = useState("");
  const [formulaName, setFormulaName] = useState("");
  const [formulaDesc, setFormulaDesc] = useState("");
  const [segments, setSegments] = useState<{label:string;pattern:string;purpose:string}[]>([]);
  const [platform, setPlatform] = useState(platforms[0]);
  const [tone, setTone] = useState<string>(tones[0]);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!sourceNiche.trim() || !targetNiche.trim()) { setError("Enter both source and target niches."); return; }
    if (!formulaName) { setError("Paste a formula — deconstruct a video first in ViralDeconstructor, then copy the formula here."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/deconstruct", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
        action: "crossniche", source_niche: sourceNiche.trim(), target_niche: targetNiche.trim(),
        formula_name: formulaName, formula_description: formulaDesc, segments, platform, tone,
      })});
      const d = await r.json();
      if (!r.ok) { setError(d.error); setLoading(false); return; }
      setResult(d); if (d.credits!==undefined) updateCredits(d.credits);
      showToast("Cross-niche adaptation ready!", "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[9px] uppercase tracking-[0.12em] text-[#fdfbf7]/35">Source Niche</label>
            <input value={sourceNiche} onChange={e => setSourceNiche(e.target.value)} placeholder="e.g. Fitness" className="mt-1 w-full border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[0.12em] text-[#fdfbf7]/35">Target Niche</label>
            <input value={targetNiche} onChange={e => setTargetNiche(e.target.value)} placeholder="e.g. Coding tutorials" className="mt-1 w-full border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-[0.12em] text-[#fdfbf7]/35">Formula Name (from Deconstructor)</label>
          <input value={formulaName} onChange={e => setFormulaName(e.target.value)} placeholder="e.g. The Contrarian Tease" className="mt-1 w-full border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-[0.12em] text-[#fdfbf7]/35">Formula Description</label>
          <input value={formulaDesc} onChange={e => setFormulaDesc(e.target.value)} placeholder="Short description of the formula" className="mt-1 w-full border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
            {platforms.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={tone} onChange={e => setTone(e.target.value)} className="border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
            {tones.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <p className="text-[9px] text-[#fdfbf7]/15">Tip: Deconstruct a viral video first, then paste its formula here.</p>
        <button onClick={run} disabled={loading} className="gold-btn w-full px-6 py-3 text-xs cursor-pointer uppercase tracking-[0.12em]">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Adapting...</span> : "Cross-Niche Remix (1 credit)"}
        </button>
      </div>

      <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {loading ? <div className="p-5 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-16 w-full" />)}</div>
        : !result ? <EmptyState title="Cross-Niche Viral Nakil" desc="Take a viral formula from one niche and adapt it to another. Use Deconstructor first to extract a formula, then transplant it here." />
        : <div className="overflow-y-auto p-5 space-y-4">
          {result.adapted_hook && <div className="border-2 border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/5 to-transparent rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#d4af37]/60 mb-1">Adapted Hook</p>
            <p className="text-sm font-semibold text-[#fdfbf7]">&ldquo;{result.adapted_hook}&rdquo;</p>
          </div>}
          {result.title && <div className="border border-white/8 rounded-lg p-3">
            <p className="text-[9px] text-[#d4af37]/40 mb-0.5">Title</p>
            <p className="text-xs font-semibold text-[#fdfbf7]">{result.title}</p>
          </div>}
          {result.adapted_script?.map((s: any, i: number) => (
            <div key={i} className="border border-white/5 bg-[#1a2332]/20 rounded-lg p-3">
              <span className="text-[9px] font-bold text-[#d4af37]/60 uppercase">{s.label}</span>
              <p className="text-[10px] text-[#fdfbf7]/55 mt-1">{s.text}</p>
            </div>
          ))}
          {result.hashtags?.length > 0 && <div className="flex flex-wrap gap-1">{result.hashtags.map((t:string,i:number)=><span key={i} className="text-[8px] text-[#d4af37]/40 border border-[#d4af37]/10 px-2 py-0.5 rounded-full">{t}</span>)}</div>}
          {result.adaptation_notes && <div className="border-t border-white/5 pt-3 mt-2">
            <p className="text-[9px] uppercase tracking-[0.12em] text-[#d4af37]/50 mb-1">Adaptation Notes</p>
            <p className="text-[10px] text-[#fdfbf7]/35 italic">{result.adaptation_notes}</p>
          </div>}
        </div>}
      </div>
    </div>
  );
}

/* ─── Preflight Lab ─── */
function PreflightLab({ credits, loading, setLoading, setError, updateCredits }: LabProps) {
  const [hook, setHook] = useState("");
  const [script, setScript] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!hook.trim() && !script.trim()) { setError("Enter at least a hook or script."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/preflight", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
        hook: hook.trim(), script: script.trim(), platform,
        hashtags: hashtags.split(/[,\s]+/).filter(Boolean), thumbnail: thumbnail.trim(),
      })});
      const d = await r.json();
      if (!r.ok) { setError(d.error); setLoading(false); return; }
      setResult(d); if (d.credits!==undefined) updateCredits(d.credits);
      showToast(d.ready_to_publish ? "Ready to publish!" : "Fixes needed", d.ready_to_publish ? "success" : "info");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Hook</label>
          <textarea value={hook} onChange={e => setHook(e.target.value)} className="mt-1.5 w-full resize-none border border-white/10 bg-[#121214] p-2.5 text-xs leading-5 text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" rows={2} placeholder="Your hook text..." />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#fdfbf7]/45">Script (optional)</label>
          <textarea value={script} onChange={e => setScript(e.target.value)} className="mt-1.5 w-full resize-none border border-white/10 bg-[#121214] p-2.5 text-xs leading-5 text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" rows={3} placeholder="Full script..." />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#fdfbf7]/45">Hashtags (comma separated)</label>
          <input value={hashtags} onChange={e => setHashtags(e.target.value)} className="mt-1.5 w-full border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" placeholder="#tag1, #tag2, #tag3" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#fdfbf7]/45">Thumbnail Text</label>
          <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} className="mt-1.5 w-full border border-white/10 bg-[#121214] px-3 py-2 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg" placeholder="THUMBNAIL TEXT" />
        </div>
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full border border-white/10 bg-[#121214] px-3 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 rounded-lg cursor-pointer">
          {platforms.map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={run} disabled={loading} className="gold-btn w-full px-6 py-3 text-xs cursor-pointer uppercase tracking-[0.12em]">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />Checking...</span> : "Preflight Check (1 credit)"}
        </button>
      </div>

      <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {loading ? <div className="p-5 space-y-3">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-12 w-full" />)}</div>
        : !result ? <EmptyState title="Pre-Publish QA" desc="Enter your hook, script, hashtags, thumbnail. AI runs 7 checks and gives you a GO/NO-GO before you publish." />
        : <div className="overflow-y-auto p-5 space-y-4">
          {/* Overall */}
          <div className={`rounded-xl p-4 text-center ${result.ready_to_publish ? "border-2 border-green-400/30 bg-green-400/5" : "border-2 border-yellow-400/30 bg-yellow-400/5"}`}>
            <p className="text-3xl mb-1">{result.ready_to_publish ? "✅" : "⚠️"}</p>
            <p className={`text-lg font-bold ${result.ready_to_publish ? "text-green-400" : "text-yellow-400"}`}>
              {result.ready_to_publish ? "READY TO PUBLISH" : "FIXES RECOMMENDED"}
            </p>
            <p className="text-xs text-[#fdfbf7]/40 mt-1">Overall Score: {result.overall_score}/100</p>
          </div>

          {/* Checks */}
          {result.checks?.map((c: any, i: number) => (
            <div key={i} className={`border rounded-lg p-3.5 ${c.passed ? "border-green-500/10 bg-green-500/3" : "border-yellow-500/10 bg-yellow-500/3"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{c.passed ? "✅" : "⚠️"}</span>
                  <span className="text-[11px] font-medium text-[#fdfbf7]/80">{c.name}</span>
                </div>
                <span className={`text-xs font-bold ${c.passed ? "text-green-400" : "text-yellow-400"}`}>{c.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-1.5">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.score}%`, background: c.passed ? "#4ade80" : "#fbbf24" }} />
              </div>
              <p className="text-[9px] text-[#fdfbf7]/30">{c.detail}</p>
            </div>
          ))}

          {/* Critical fixes */}
          {result.critical_fixes?.length > 0 && <div className="border-t border-red-500/20 pt-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/80 mb-2">Critical Fixes</p>
            {result.critical_fixes.map((f: string, i: number) => (
              <p key={i} className="text-[10px] text-[#fdfbf7]/50 flex items-start gap-1.5 mb-1">
                <span className="text-red-400 shrink-0 mt-px">•</span> {f}
              </p>
            ))}
          </div>}
        </div>}
      </div>
    </div>
  );
}

/* ─── Shared ─── */
type LabProps = {
  credits: number | null;
  loading: boolean;
  setLoading: (v: boolean) => void;
  setError: (v: string) => void;
  updateCredits: (c: number) => void;
};

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-4">
        <span className="text-2xl">🧪</span>
      </div>
      <p className="text-sm text-[#fdfbf7]/20 font-medium">{title}</p>
      <p className="text-[11px] text-[#fdfbf7]/10 mt-1 max-w-[260px] leading-relaxed">{desc}</p>
    </div>
  );
}
