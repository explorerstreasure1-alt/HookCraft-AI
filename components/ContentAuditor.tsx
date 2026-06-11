"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";
import { showToast } from "./Toast";

type AuditResult = {
  pattern: string;
  breakdown: { dimension: string; score: number; note: string }[];
  strengths: string[];
  weaknesses: string[];
  improvements: { text: string; score: number }[];
  platform_fit: { platform: string; score: number; reason: string }[];
  credits?: number;
};

type CompareResult = {
  hooks: { text: string; scores: { dimension: string; score: number }[]; total: number }[];
  winner: { text: string; reason: string };
  recommendation: string;
  credits?: number;
};

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];

const dimensionColors: Record<string, string> = {
  "Curiosity Gap": "#d4af37",
  "Emotional Pull": "#e07040",
  "Pattern Interrupt": "#60b0e0",
  "Specificity": "#50c878",
  "Urgency": "#e05050",
  "Scroll-Stopping Power": "#d4af37",
  "Clarity": "#50c878",
  "Emotional Resonance": "#e07040",
  "Algorithm Fit": "#60b0e0",
  "Shareability": "#c070d0",
};

function scoreBar(score: number, color: string) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-white/60 w-7 text-right">{score}</span>
    </div>
  );
}

export default function ContentAuditor() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"auditor" | "battle">("auditor");
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auditor state
  const [auditHook, setAuditHook] = useState("");
  const [auditPlatform, setAuditPlatform] = useState(platforms[0]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Battle state
  const [battleHooks, setBattleHooks] = useState<string[]>(["", ""]);
  const [battlePlatform, setBattlePlatform] = useState(platforms[0]);
  const [battleResult, setBattleResult] = useState<CompareResult | null>(null);

  function fetchCredits() {
    fetch("/api/credits").then(r => r.json()).then((d: { credits: number }) => {
      if (d.credits !== undefined) setCredits(d.credits);
    }).catch(() => {});
  }

  useEffect(() => { fetchCredits(); }, []);

  useEffect(() => {
    function onCredits(e: Event) { setCredits((e as CustomEvent).detail); }
    window.addEventListener("credits-updated", onCredits);
    return () => window.removeEventListener("credits-updated", onCredits);
  }, []);

  async function handleAudit() {
    if (loading) return;
    if (!auditHook.trim()) { setError("Paste a hook to audit."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setLoading(true); setAuditResult(null);
    try {
      const r = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook: auditHook.trim(), platform: auditPlatform }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Audit failed."); setLoading(false); return; }
      setAuditResult(d);
      if (d.credits !== undefined) { setCredits(d.credits); window.dispatchEvent(new CustomEvent("credits-updated", { detail: d.credits })); }
      showToast("Hook audited!", "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  async function handleCompare() {
    if (loading) return;
    const filled = battleHooks.filter(h => h.trim());
    if (filled.length < 2) { setError("Enter at least 2 hooks to compare."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setLoading(true); setBattleResult(null);
    try {
      const r = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hooks: filled, platform: battlePlatform }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Comparison failed."); setLoading(false); return; }
      setBattleResult(d);
      if (d.credits !== undefined) { setCredits(d.credits); window.dispatchEvent(new CustomEvent("credits-updated", { detail: d.credits })); }
      showToast(`Winner: ${d.winner?.text?.slice(0, 60)}...`, "success");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  function setBattleHook(idx: number, value: string) {
    setBattleHooks(prev => prev.map((h, i) => i === idx ? value : h));
  }

  function addBattleSlot() {
    if (battleHooks.length >= 4) return;
    setBattleHooks(prev => [...prev, ""]);
  }

  function removeBattleSlot(idx: number) {
    if (battleHooks.length <= 2) return;
    setBattleHooks(prev => prev.filter((_, i) => i !== idx));
  }

  async function copyText(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); showToast("Copied!", "success"); } catch { showToast("Copy failed", "info"); }
  }

  const hasAudit = auditResult && auditResult.breakdown.length > 0;
  const hasCompare = battleResult && battleResult.hooks.length > 0;

  return (
    <section id="auditor" className="bg-[#0c0d10] px-4 py-20 text-[#fdfbf7] sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">New</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.05em]">Content Auditor &amp; Hook Battle</h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-[#fdfbf7]/65">
            Paste a hook to reverse-engineer its DNA. Or pit multiple hooks head-to-head and let AI crown a winner.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mt-8 flex rounded-full border border-white/10 bg-[#121214] p-1 w-fit">
          <button
            onClick={() => { setTab("auditor"); setError(""); }}
            className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] rounded-full transition cursor-pointer ${
              tab === "auditor" ? "bg-[#d4af37] text-[#121214]" : "text-[#fdfbf7]/40 hover:text-[#fdfbf7]/70"
            }`}
          >
            Auditor
          </button>
          <button
            onClick={() => { setTab("battle"); setError(""); }}
            className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] rounded-full transition cursor-pointer ${
              tab === "battle" ? "bg-[#d4af37] text-[#121214]" : "text-[#fdfbf7]/40 hover:text-[#fdfbf7]/70"
            }`}
          >
            Battle
          </button>
        </div>

        {/* Auditor tab */}
        {tab === "auditor" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* Input */}
            <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]" htmlFor="audit-hook">Paste a hook</label>
              <textarea
                id="audit-hook"
                value={auditHook}
                onChange={e => setAuditHook(e.target.value)}
                className="mt-2 min-h-[120px] w-full resize-none border border-white/10 bg-[#121214] p-3.5 text-sm leading-6 text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/25 focus:border-[#d4af37]/60 rounded-xl transition"
                placeholder='e.g. "Everyone sells the AI dream but nobody shows this part"'
              />

              <div className="mt-4">
                <label className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/45">Platform</label>
                <select
                  value={auditPlatform}
                  onChange={e => setAuditPlatform(e.target.value)}
                  className="mt-2 w-full border border-white/10 bg-[#121214] px-3.5 py-2.5 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/60 rounded-lg cursor-pointer"
                >
                  {platforms.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleAudit}
                disabled={loading || (credits !== null && credits < 1)}
                className="gold-btn w-full mt-4 px-6 py-3.5 text-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    Auditing...
                  </span>
                ) : "Audit Hook (1 credit)"}
              </button>
            </div>

            {/* Results */}
            <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 80px)" }}>
              {loading ? (
                <div className="p-5 space-y-4">
                  <div className="skeleton h-6 w-1/3" />
                  <div className="skeleton h-4 w-2/3" />
                  <div className="space-y-3 mt-4">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
                  </div>
                </div>
              ) : !hasAudit ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d4af37]/30">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[#fdfbf7]/20 font-medium mb-4">How it works</p>
                  <div className="space-y-2 text-left max-w-[260px]">
                    {[
                      { n: "1", t: "Paste any video hook" },
                      { n: "2", t: "AI reverse-engineers the pattern" },
                      { n: "3", t: "See scores on 5 dimensions" },
                      { n: "4", t: "Get 3 stronger alternatives" },
                    ].map(s => (
                      <div key={s.n} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-[#d4af37]/20 flex items-center justify-center text-[9px] text-[#d4af37]/40 shrink-0">{s.n}</span>
                        <span className="text-[11px] text-[#fdfbf7]/12">{s.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Pattern badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/60">Pattern</span>
                    <span className="px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-xs font-semibold text-[#d4af37] uppercase">{auditResult?.pattern}</span>
                  </div>

                  {/* Dimension breakdown */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Score Breakdown</p>
                    <div className="space-y-3">
                      {auditResult?.breakdown.map((d, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: dimensionColors[d.dimension] || "#d4af37" }} />
                              <span className="text-[11px] font-medium text-[#fdfbf7]/80">{d.dimension}</span>
                            </div>
                          </div>
                          {scoreBar(d.score, dimensionColors[d.dimension] || "#d4af37")}
                          <p className="text-[9px] text-[#fdfbf7]/25 mt-0.5">{d.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="border border-green-500/10 bg-green-500/3 rounded-lg p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-green-400/70 mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {auditResult?.strengths.map((s, i) => (
                          <li key={i} className="text-[11px] text-[#fdfbf7]/55 flex items-start gap-1.5">
                            <span className="text-green-400/60 mt-px">+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-red-500/10 bg-red-500/3 rounded-lg p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/70 mb-2">Weaknesses</p>
                      <ul className="space-y-1">
                        {auditResult?.weaknesses.map((s, i) => (
                          <li key={i} className="text-[11px] text-[#fdfbf7]/55 flex items-start gap-1.5">
                            <span className="text-red-400/60 mt-px">&minus;</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Improved versions */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Improved Versions</p>
                    <div className="space-y-2">
                      {auditResult?.improvements.map((imp, i) => (
                        <div key={i} className="group border border-white/8 bg-[#1a2332]/30 rounded-lg p-3.5 transition hover:border-[#d4af37]/30">
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-[10px] text-[#d4af37]/50 shrink-0 mt-0.5">{i + 1}</span>
                            <p className="flex-1 text-[12px] leading-5 text-[#fdfbf7]/75">{imp.text}</p>
                            <span className="shrink-0 text-[11px] font-bold text-[#d4af37]">{imp.score}</span>
                          </div>
                          <button
                            onClick={() => { navigator.clipboard.writeText(imp.text); showToast("Copied!", "success"); }}
                            className="mt-1.5 ml-6 text-[9px] uppercase tracking-[0.12em] text-[#d4af37]/30 group-hover:text-[#d4af37]/70 transition cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Platform fit */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Platform Fit</p>
                    <div className="grid gap-2 grid-cols-2">
                      {auditResult?.platform_fit.map((pf, i) => (
                        <div key={i} className="border border-white/5 bg-[#1a2332]/30 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[#fdfbf7]/50">{pf.platform}</span>
                            <span className="text-[10px] font-bold text-[#d4af37]">{pf.score}</span>
                          </div>
                          {scoreBar(pf.score, "#d4af37")}
                          <p className="text-[8px] text-[#fdfbf7]/18 mt-1 leading-tight">{pf.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Battle tab */}
        {tab === "battle" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* Input */}
            <div className="border border-white/10 bg-[#1a2332]/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">Enter hooks to compare</label>
                <span className="text-[9px] text-[#fdfbf7]/20">{battleHooks.filter(h => h.trim()).length}/4 hooks</span>
              </div>

              <div className="space-y-3">
                {battleHooks.map((h, i) => (
                  <div key={i} className="relative">
                    <textarea
                      value={h}
                      onChange={e => setBattleHook(i, e.target.value)}
                      className="w-full resize-none border border-white/10 bg-[#121214] p-3 text-xs leading-5 text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/20 focus:border-[#d4af37]/40 rounded-lg transition"
                      placeholder={`Hook ${i + 1}...`}
                      rows={2}
                    />
                    <div className="absolute top-2 left-2.5">
                      <span className="text-[9px] font-bold text-[#d4af37]/30">{i + 1}</span>
                    </div>
                    {battleHooks.length > 2 && (
                      <button
                        onClick={() => removeBattleSlot(i)}
                        className="absolute top-2 right-2 text-[9px] text-zinc-600 hover:text-red-400 transition cursor-pointer"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {battleHooks.length < 4 && (
                <button
                  onClick={addBattleSlot}
                  className="mt-2 w-full border border-dashed border-white/10 rounded-lg p-2.5 text-[10px] text-[#fdfbf7]/20 hover:border-[#d4af37]/30 hover:text-[#d4af37]/40 transition cursor-pointer"
                >
                  + Add hook
                </button>
              )}

              <div className="mt-4">
                <label className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/45">Platform</label>
                <select
                  value={battlePlatform}
                  onChange={e => setBattlePlatform(e.target.value)}
                  className="mt-2 w-full border border-white/10 bg-[#121214] px-3.5 py-2.5 text-sm text-[#fdfbf7] outline-none focus:border-[#d4af37]/60 rounded-lg cursor-pointer"
                >
                  {platforms.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={loading || (credits !== null && credits < 1)}
                className="gold-btn w-full mt-4 px-6 py-3.5 text-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    Comparing...
                  </span>
                )                 : "Battle! (1 credit)"}
              </button>
            </div>

            {/* Results */}
            <div className="border border-[#d4af37]/20 bg-[#121214] rounded-xl overflow-hidden" style={{ maxHeight: "calc(100vh - 80px)" }}>
              {loading ? (
                <div className="p-5 space-y-4">
                  <div className="skeleton h-6 w-1/3" />
                  <div className="skeleton h-4 w-2/3" />
                  <div className="space-y-3 mt-4">
                    {[1, 2].map(i => <div key={i} className="skeleton h-24 w-full" />)}
                  </div>
                </div>
              ) : !hasCompare ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d4af37]/30">
                      <path d="M18 20V10M12 20V4M6 20v-6"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[#fdfbf7]/20 font-medium mb-4">How it works</p>
                  <div className="space-y-2 text-left max-w-[260px]">
                    {[
                      { n: "1", t: "Enter 2-4 hooks" },
                      { n: "2", t: "AI scores each on 5 dimensions" },
                      { n: "3", t: "See visual head-to-head bars" },
                      { n: "4", t: "Winner crowned with reasoning" },
                    ].map(s => (
                      <div key={s.n} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-[#d4af37]/20 flex items-center justify-center text-[9px] text-[#d4af37]/40 shrink-0">{s.n}</span>
                        <span className="text-[11px] text-[#fdfbf7]/12">{s.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Winner banner */}
                  {battleResult?.winner.text && (
                    <div className="border-2 border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/8 to-transparent rounded-xl p-4">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#d4af37] mb-1">Winner</p>
                      <p className="text-sm font-semibold text-[#fdfbf7] mb-1.5">&ldquo;{battleResult.winner.text}&rdquo;</p>
                      <p className="text-[11px] text-[#fdfbf7]/40 leading-relaxed">{battleResult.winner.reason}</p>
                    </div>
                  )}

                  {/* Hook comparison cards */}
                  {battleResult?.hooks.map((h, i) => {
                    const isWinner = h.text === battleResult.winner.text;
                    return (
                      <div key={i} className={`rounded-xl p-4 transition border ${
                        isWinner
                          ? "border-[#d4af37]/40 bg-gradient-to-br from-[#1a2332] to-[#0f151c] ring-1 ring-[#d4af37]/10"
                          : "border-white/8 bg-[#1a2332]/30"
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-mono text-[10px] shrink-0 ${isWinner ? "text-[#d4af37]" : "text-[#fdfbf7]/30"}`}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className={`text-[12px] font-medium truncate ${isWinner ? "text-[#fdfbf7]" : "text-[#fdfbf7]/60"}`}>
                              {h.text.length > 80 ? h.text.slice(0, 80) + "..." : h.text}
                            </p>
                          </div>
                          {isWinner && (
                            <span className="shrink-0 text-[9px] uppercase tracking-[0.15em] text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full">Winner</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {h.scores.map((s, j) => (
                            <div key={j}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] text-[#fdfbf7]/30">{s.dimension}</span>
                              </div>
                              {scoreBar(s.score, dimensionColors[s.dimension] || "#d4af37")}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <span className="text-[9px] uppercase tracking-[0.12em] text-[#d4af37]/60">Total</span>
                          <span className={`text-base font-bold ${isWinner ? "text-[#d4af37]" : "text-[#fdfbf7]/40"}`}>{h.total}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Recommendation */}
                  {battleResult?.recommendation && (
                    <div className="border border-white/10 bg-[#1a2332]/50 rounded-lg p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">Recommendation</p>
                      <p className="text-[11px] text-[#fdfbf7]/55 leading-relaxed">{battleResult.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
