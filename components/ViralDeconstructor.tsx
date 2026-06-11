"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useRef, useState } from "react";
import { showToast } from "./Toast";
import { extractFrames, extractAudio, floatArrayToB64, parseTime } from "@/lib/media.client";

type Segment = {
  time: string;
  label: string;
  pattern: string;
  purpose: string;
  hook_text: string;
  score: number;
};

type DeconstructResult = {
  formula_name: string;
  formula_description: string;
  segments: Segment[];
  emotional_arc: { point: string; level: number }[];
  viral_ingredients: string[];
  why_it_works: string;
  credits?: number;
};

type RemixResult = {
  script: { label: string; text: string; purpose: string }[];
  hook: { text: string; score: number };
  title: string;
  hashtags: string[];
  credits?: number;
};

const platforms = ["TikTok", "YouTube Shorts", "Instagram Reels", "LinkedIn Video"];

const segmentColors = ["#d4af37", "#60b0e0", "#50c878", "#e07040", "#c070d0", "#e0a030", "#40a0c0"];

export default function ViralDeconstructor() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deconstructing, setDeconstructing] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [error, setError] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [scenes, setScenes] = useState<{ start: number; end: number; title: string }[]>([]);
  const [platform, setPlatform] = useState(platforms[0]);
  const [result, setResult] = useState<DeconstructResult | null>(null);
  const [remixTopic, setRemixTopic] = useState("");
  const [remixTone, setRemixTone] = useState<"cinematic" | "contrarian" | "urgent">("cinematic");
  const [remixResult, setRemixResult] = useState<RemixResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return;
    setAnalyzing(true); setScenes([]); setTranscript(""); setResult(null); setRemixResult(null);
    setVideoFile(file.type.startsWith("video/") ? file : null);
    try {
      const isVideo = file.type.startsWith("video/");
      let audioB64 = "";
      const [frames] = await Promise.all([
        isVideo ? extractFrames(file, 10) : Promise.resolve([]),
        (async () => {
          if (isVideo) { const a = await extractAudio(file); audioB64 = await floatArrayToB64(a); }
          else { audioB64 = await new Promise<string>(r => { const rd = new FileReader(); rd.onload = () => r((rd.result as string).split(",")[1]); rd.readAsDataURL(file); }); }
        })(),
      ]);

      const tr = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: audioB64, type: isVideo ? "video" : "audio" }) });
      const td = await tr.json();
      if (!td.text) { showToast("No speech detected.", "info"); setAnalyzing(false); return; }
      setTranscript(td.text);

      if (isVideo && frames.length > 0) {
        showToast("Detecting scenes...", "info");
        const sr = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frames: frames.map(f => f.url), transcript: td.text }) });
        const sd = await sr.json();
        if (sd.scenes?.length) {
          const parsed: { start: number; end: number; title: string }[] = sd.scenes.map((s: { start: string; end: string; title: string }) => ({
            start: parseTime(s.start), end: parseTime(s.end), title: s.title,
          }));
          setScenes(parsed);
        }
      }
      showToast("Ready to deconstruct!", "success");
      setRemixTopic(td.topic?.replace("Video about: ", "") || "");
    } catch { showToast("Analysis failed.", "info"); }
    finally { setAnalyzing(false); }
  }

  async function handleDeconstruct() {
    if (!transcript) { setError("Upload a video first."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setDeconstructing(true); setResult(null);
    try {
      const r = await fetch("/api/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, scenes, platform }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed."); setDeconstructing(false); return; }
      setResult(d);
      if (d.credits !== undefined) { setCredits(d.credits); window.dispatchEvent(new CustomEvent("credits-updated", { detail: d.credits })); }
      showToast("Formula extracted!", "success");
    } catch { setError("Network error."); }
    finally { setDeconstructing(false); }
  }

  async function handleRemix() {
    if (!remixTopic.trim()) { setError("Enter your topic to remix."); return; }
    if (!result) { setError("Deconstruct a video first."); return; }
    if (credits !== null && credits < 1) { setError("Need 1 credit."); return; }
    setError(""); setRemixing(true); setRemixResult(null);
    try {
      const r = await fetch("/api/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remix",
          topic: remixTopic.trim(),
          platform,
          tone: remixTone,
          formula_name: result.formula_name,
          formula_description: result.formula_description,
          segments: result.segments.map(s => ({ label: s.label, pattern: s.pattern, purpose: s.purpose })),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Remix failed."); setRemixing(false); return; }
      setRemixResult(d);
      if (d.credits !== undefined) { setCredits(d.credits); window.dispatchEvent(new CustomEvent("credits-updated", { detail: d.credits })); }
      showToast("Remix ready!", "success");
    } catch { setError("Network error."); }
    finally { setRemixing(false); }
  }

  const hasVideo = !!videoFile;
  const hasResult = result && result.segments.length > 0;

  return (
    <section id="deconstructor" className="bg-[#0c0d10] px-4 py-24 text-[#fdfbf7] sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37] px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 animate-pulse">Premium</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.05em]">Viral Deconstructor</h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-[#fdfbf7]/65">
            Drop any competitor&apos;s viral video. AI extracts the exact formula, emotional arc, and structural DNA.
            Then remix it with YOUR topic.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: Video upload + controls */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black">
              {videoUrl ? (
                <video ref={videoRef} src={videoUrl} controls className="w-full aspect-video" />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-[#121214]">
                  <p className="text-[#fdfbf7]/15 text-sm">Drop a viral video</p>
                </div>
              )}
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                analyzing ? "border-[#d4af37] bg-[#d4af37]/5 pointer-events-none" :
                dragOver ? "border-[#d4af37] bg-[#d4af37]/5" :
                "border-white/10 hover:border-white/20"
              }`}
            >
              {analyzing ? (
                <div className="space-y-2">
                  <div className="mx-auto w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#d4af37]">Extracting audio & frames...</p>
                </div>
              ) : hasVideo ? (
                <label className="cursor-pointer block">
                  <p className="text-sm text-[#fdfbf7]/35">Drop another video or click to replace</p>
                  <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              ) : (
                <label className="cursor-pointer block">
                  <p className="text-2xl mb-2">🔬</p>
                  <p className="text-base text-[#fdfbf7]/35 font-medium">Drop a viral video to deconstruct</p>
                  <p className="text-xs text-[#fdfbf7]/15 mt-1">MP4, MOV — up to 5 min</p>
                  <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              )}
            </div>

            {hasVideo && (
              <div className="flex items-center gap-3 flex-wrap">
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-4 py-2.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 cursor-pointer">
                  {platforms.map(p => <option key={p}>{p}</option>)}
                </select>
                {transcript && <span className="text-[10px] text-[#fdfbf7]/25">{Math.ceil(transcript.length / 150)}s speech</span>}
                {scenes.length > 0 && <span className="text-[10px] text-[#fdfbf7]/25">{scenes.length} scenes</span>}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleDeconstruct}
              disabled={deconstructing || !hasVideo || (credits !== null && credits < 1)}
              className="gold-btn w-full px-6 py-4 text-sm cursor-pointer relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {deconstructing ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                  Deconstructing DNA...
                </span>
              ) : (
                <span className="relative z-10">Deconstruct Viral Formula (1 credit)</span>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="border border-[#d4af37]/20 bg-[#121214] rounded-2xl overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
            {deconstructing ? (
              <div className="p-6 space-y-4">
                <div className="skeleton h-7 w-1/2" />
                <div className="skeleton h-4 w-3/4" />
                <div className="space-y-3 mt-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 w-full" />)}
                </div>
              </div>
            ) : !hasResult ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center px-8">
                <div className="w-20 h-20 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-6">
                  <span className="text-3xl">🔬</span>
                </div>
                <p className="text-sm text-[#fdfbf7]/20 font-medium mb-1">Reverse-Engineer Any Viral Video</p>
                <p className="text-[11px] text-[#fdfbf7]/10 max-w-[280px] leading-relaxed">
                  ChatGPT can&apos;t watch videos. HookCraft extracts frames, transcribes audio, and breaks down the exact formula that made it viral.
                </p>
                <div className="mt-6 space-y-2 text-left">
                  {[
                    { n: "1", t: "Drop a viral competitor video" },
                    { n: "2", t: "AI extracts the structural blueprint" },
                    { n: "3", t: "See timeline, emotional arc, ingredients" },
                    { n: "4", t: "Remix the formula with YOUR topic" },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full border border-[#d4af37]/20 flex items-center justify-center text-[9px] text-[#d4af37]/40 shrink-0">{s.n}</span>
                      <span className="text-[11px] text-[#fdfbf7]/12">{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {/* Formula header */}
                <div className="sticky top-0 z-10 bg-[#121214]/95 backdrop-blur-sm border-b border-[#d4af37]/20 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">🧬</span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] mb-0.5">Viral Formula</p>
                      <p className="text-lg font-bold text-[#fdfbf7]">{result.formula_name}</p>
                      <p className="text-[11px] text-[#fdfbf7]/40 mt-0.5">{result.formula_description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Timeline segments */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Timeline Blueprint</p>
                    <div className="relative pl-6 border-l-2 border-white/5 space-y-0">
                      {result.segments.map((seg, i) => {
                        const color = segmentColors[i % segmentColors.length];
                        const maxScore = Math.max(...result.segments.map(s => s.score), 1);
                        const height = Math.max(60, (seg.score / maxScore) * 100);
                        return (
                          <div key={i} className="relative pb-4 last:pb-0">
                            <div
                              className="absolute left-[-21px] top-1 w-4 h-4 rounded-full border-2"
                              style={{ background: color, borderColor: color, boxShadow: `0 0 10px ${color}44` }}
                            />
                            <div className="ml-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] text-[#fdfbf7]/30">{seg.time}</span>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em]" style={{ background: `${color}22`, color }}>
                                  {seg.label}
                                </span>
                                <span className="text-[10px] text-[#fdfbf7]/20">{seg.pattern}</span>
                              </div>
                              <p className="text-[11px] text-[#fdfbf7]/50 mt-1 italic">&ldquo;{seg.hook_text}&rdquo;</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${seg.score}%`, background: color }} />
                                </div>
                                <span className="text-[10px] font-bold text-[#fdfbf7]/50">{seg.score}</span>
                              </div>
                              <p className="text-[9px] text-[#fdfbf7]/18 mt-0.5">{seg.purpose}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Emotional arc */}
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Emotional Arc</p>
                    <div className="flex items-end gap-1 h-24">
                      {result.emotional_arc.map((ep, i) => {
                        const color = segmentColors[i % segmentColors.length];
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-bold text-[#fdfbf7]/50">{ep.level}</span>
                            <div
                              className="w-full rounded-t-md transition-all duration-1000 min-h-[4px]"
                              style={{
                                height: `${ep.level}%`,
                                background: `linear-gradient(to top, ${color}44, ${color})`,
                                boxShadow: `0 0 6px ${color}33`,
                              }}
                            />
                            <span className="text-[8px] text-[#fdfbf7]/20 text-center leading-tight mt-1">{ep.point}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Viral ingredients */}
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-3">Viral Ingredients</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.viral_ingredients.map((ing, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full border border-[#d4af37]/15 bg-[#d4af37]/3 text-[10px] text-[#d4af37]/70">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Why it worked */}
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37] mb-2">Why This Worked</p>
                    <p className="text-[11px] text-[#fdfbf7]/50 leading-relaxed italic">{result.why_it_works}</p>
                  </div>

                  {/* Remix section */}
                  <div className="border-t border-[#d4af37]/20 pt-5 mt-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#d4af37] mb-4">
                      Remix This Formula With Your Topic
                    </p>
                    <div className="space-y-3">
                      <textarea
                        value={remixTopic}
                        onChange={e => setRemixTopic(e.target.value)}
                        placeholder="Your topic or niche..."
                        className="w-full resize-none border border-white/10 bg-[#1a2332]/50 p-3 text-xs leading-5 text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/20 focus:border-[#d4af37]/40 rounded-lg transition"
                        rows={2}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <select value={remixTone} onChange={e => setRemixTone(e.target.value as "cinematic" | "contrarian" | "urgent")} className="rounded-full border border-white/10 bg-[#121214] px-4 py-2 text-[10px] text-[#fdfbf7] outline-none focus:border-[#d4af37]/40 cursor-pointer">
                          <option value="cinematic">Cinematic</option>
                          <option value="contrarian">Contrarian</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <button
                          onClick={handleRemix}
                          disabled={remixing || !remixTopic.trim()}
                          className="gold-btn px-6 py-2 text-[10px] uppercase tracking-[0.15em] cursor-pointer"
                        >
                          {remixing ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                              Remixing...
                            </span>
                          )                           : "Remix Formula (1 credit)"}
                        </button>
                      </div>
                    </div>

                    {remixResult && remixResult.script.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl border-2 border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/5 to-transparent p-4">
                          <p className="text-[9px] uppercase tracking-[0.15em] text-[#d4af37]/60 mb-1">Remixed Hook</p>
                          <p className="text-sm font-semibold text-[#fdfbf7] mb-1">&ldquo;{remixResult.hook.text}&rdquo;</p>
                          <span className="text-[10px] font-bold text-[#d4af37]">{remixResult.hook.score}</span>
                        </div>
                        {remixResult.title && (
                          <div className="border border-white/8 bg-[#1a2332]/30 rounded-lg p-3">
                            <p className="text-[9px] uppercase tracking-[0.15em] text-[#d4af37]/60 mb-1">Title</p>
                            <p className="text-xs font-semibold text-[#fdfbf7]">{remixResult.title}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          {remixResult.script.map((seg, i) => (
                            <div key={i} className="group border border-white/5 bg-[#1a2332]/20 rounded-lg p-3 hover:border-[#d4af37]/20 transition">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#d4af37]/60">{seg.label}</span>
                                <span className="text-[8px] text-[#fdfbf7]/20">{seg.purpose}</span>
                              </div>
                              <p className="text-[11px] leading-5 text-[#fdfbf7]/65">{seg.text}</p>
                              <button
                                onClick={() => { navigator.clipboard.writeText(seg.text); showToast("Copied!", "success"); }}
                                className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-[#d4af37]/20 group-hover:text-[#d4af37]/60 transition cursor-pointer"
                              >
                                Copy
                              </button>
                            </div>
                          ))}
                        </div>
                        {remixResult.hashtags && remixResult.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {remixResult.hashtags.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full border border-[#d4af37]/10 bg-[#d4af37]/3 text-[9px] text-[#d4af37]/50">{t}</span>
                            ))}
                          </div>
                        )}
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
