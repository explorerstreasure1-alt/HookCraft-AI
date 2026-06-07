"use client";

import { useEffect, useRef, useState } from "react";
import { showToast } from "./Toast";

type Scene = {
  id: number;
  start: number;
  end: number;
  title: string;
  visual_clue: string;
  hook: { text: string; score: number };
  selected: boolean;
  text: string;
  frameUrl: string;
};

function extractFrames(file: File, count: number): Promise<{ url: string; time: number }[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true;
    const url = URL.createObjectURL(file); video.src = url;
    video.onloadedmetadata = async () => {
      const duration = Math.min(video.duration, 300);
      const interval = duration / count;
      const frames: { url: string; time: number }[] = [];
      const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext("2d")!;
      for (let i = 0; i < count; i++) {
        const t = Math.min(i * interval, duration - 0.1);
        video.currentTime = t;
        await new Promise<void>(r => { video.onseeked = () => r(); });
        ctx.drawImage(video, 0, 0, 320, 180);
        frames.push({ url: canvas.toDataURL("image/jpeg", 0.5), time: t });
      }
      URL.revokeObjectURL(url); video.remove(); resolve(frames);
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
  });
}

async function extractAudio(file: File): Promise<Float32Array> {
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  const ab = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(ab.slice(0));
  const duration = Math.min(audioBuffer.duration, 300);
  const sampleCount = Math.floor(duration * 16000);
  const offlineCtx = new OfflineAudioContext(1, sampleCount, 16000);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, 0, duration);
  const rendered = await offlineCtx.startRendering();
  audioCtx.close();
  return rendered.getChannelData(0);
}

async function audioToBase64(data: Float32Array): Promise<string> {
  const wav = new ArrayBuffer(44 + data.length * 2);
  const view = new DataView(wav);
  function ws(o: number, s: string) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }
  ws(0, "RIFF"); view.setUint32(4, wav.byteLength - 8, true); ws(8, "WAVE"); ws(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); ws(36, "data"); view.setUint32(40, data.length * 2, true);
  let off = 44;
  for (let i = 0; i < data.length; i++) { view.setInt16(off, Math.max(-1, Math.min(1, data[i])) * 0x7FFF, true); off += 2; }
  const bytes = new Uint8Array(wav);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function parseTime(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  return parts[0] || 0;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export default function KeyScenes() {
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [copied, setCopied] = useState("");
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [transition, setTransition] = useState("cut");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return;
    setAnalyzing(true); setScenes([]); setVideoFile(file.type.startsWith("video/") ? file : null);
    try {
      const isVideo = file.type.startsWith("video/");
      let audioB64 = "";
      const [frames] = await Promise.all([
        isVideo ? extractFrames(file, 10) : Promise.resolve([]),
        (async () => {
          if (isVideo) { const a = await extractAudio(file); audioB64 = await audioToBase64(a); }
          else { audioB64 = await new Promise<string>(r => { const rd = new FileReader(); rd.onload = () => r((rd.result as string).split(",")[1]); rd.readAsDataURL(file); }); }
        })(),
      ]);

      const tr = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: audioB64, type: isVideo ? "video" : "audio" }) });
      const td = await tr.json();
      if (!td.text) { showToast("No speech detected.", "info"); setAnalyzing(false); return; }

      showToast("Detecting scenes visually...", "info");
      const sr = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frames: frames.map(f => f.url), transcript: td.text }) });
      const sd = await sr.json();

      if (sd.scenes?.length) {
        const parsed: Scene[] = sd.scenes.map((s: { start: string; end: string; title: string; visual_clue: string; hook: { text: string; score: number } }, i: number) => {
          const st = parseTime(s.start);
          const nearestFrame = frames.reduce((best, f) => Math.abs(f.time - st) < Math.abs(best.time - st) ? f : best, frames[0] || { url: "", time: 0 });
          return { id: i, start: st, end: parseTime(s.end), title: s.title, visual_clue: s.visual_clue, hook: s.hook, selected: true, text: "", frameUrl: nearestFrame.url };
        });
        setScenes(parsed);
        showToast(`${parsed.length} scenes detected!`, "success");
      } else showToast("No scenes found.", "info");
    } catch { showToast("Analysis failed.", "info"); }
    finally { setAnalyzing(false); }
  }

  function hoverScene(start: number) { if (videoRef.current) { videoRef.current.currentTime = start; } }
  function playScene(start: number) { if (videoRef.current) { videoRef.current.currentTime = start; videoRef.current.play().catch(() => {}); } }

  function toggleScene(id: number) { setScenes(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)); }
  function selectAll() { setScenes(prev => prev.map(s => ({ ...s, selected: true }))); }
  function deselectAll() { setScenes(prev => prev.map(s => ({ ...s, selected: false }))); }

  function moveScene(from: number, to: number) {
    setScenes(prev => { const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
  }

  function adjustDuration(id: number, delta: number) {
    setScenes(prev => prev.map(s => {
      if (s.id !== id) return s;
      const dt = s.end - s.start;
      const newDt = clamp(dt + delta, 1, 60);
      return { ...s, end: s.start + newDt };
    }));
  }

  async function renderVideo() {
    const selected = scenes.filter(s => s.selected);
    if (selected.length === 0 || !videoFile || !videoUrl) return;
    setRendering(true); setRenderProgress(0);
    try {
      const video = document.createElement("video");
      video.src = videoUrl; video.muted = true;
      await new Promise<void>(r => { video.onloadedmetadata = () => r(); });

      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      const stream = canvas.captureStream(30);
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      recorder.ondataavailable = e => chunks.push(e.data);
      const done = new Promise<void>(r => { recorder.onstop = () => r(); });
      recorder.start();

      let totalFrames = 0;
      for (const s of selected) totalFrames += Math.ceil((s.end - s.start) * 30);
      let renderedFrames = 0;

      for (let si = 0; si < selected.length; si++) {
        const scene = selected[si];
        video.currentTime = scene.start;
        await new Promise<void>(r => { video.onseeked = () => r(); });

        if (transition === "fade" && si > 0) {
          const fadeFrames = 15;
          for (let f = 0; f < fadeFrames; f++) {
            video.currentTime = scene.start + f / 30;
            await new Promise<void>(r => { video.onseeked = () => r(); });
            ctx.globalAlpha = f / fadeFrames;
            ctx.drawImage(video, 0, 0, 640, 360);
            ctx.globalAlpha = 1;
            if (scene.text) { ctx.fillStyle = "white"; ctx.font = "bold 28px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText(scene.text, 320, 330); }
            await new Promise(r => setTimeout(r, 33));
            renderedFrames++;
          }
        }

        const frames = Math.ceil((scene.end - scene.start) * 30);
        for (let f = 0; f < frames; f++) {
          video.currentTime = scene.start + f / 30;
          await new Promise<void>(r => { video.onseeked = () => r(); });
          ctx.drawImage(video, 0, 0, 640, 360);
          if (scene.text) { ctx.fillStyle = "white"; ctx.font = "bold 28px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText(scene.text, 320, 330); }
          await new Promise(r => setTimeout(r, 33));
          renderedFrames++;
          setRenderProgress(Math.round((renderedFrames / totalFrames) * 100));
        }
      }

      recorder.stop(); await done;
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `hookcraft-edit-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
      showToast("Video rendered!", "success");
    } catch { showToast("Render failed.", "info"); }
    finally { setRendering(false); setRenderProgress(0); }
  }

  const selectedCount = scenes.filter(s => s.selected).length;
  const totalDuration = scenes.filter(s => s.selected).reduce((sum, s) => sum + (s.end - s.start), 0);

  return (
    <section id="keyscenes" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37] px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">New</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">AI Scene Editor</h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            Drop a video. AI detects every scene change. Select, reorder, add text, render.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black">
              {videoUrl ? (
                <video ref={videoRef} src={videoUrl} controls className="w-full aspect-video" />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-[#121214]">
                  <p className="text-[#fdfbf7]/15 text-sm">Video preview</p>
                </div>
              )}
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onPaste={e => { const f = e.clipboardData.files[0]; if (f) { e.preventDefault(); handleFile(f); } }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${analyzing ? "border-[#d4af37] bg-[#d4af37]/5 pointer-events-none" : dragOver ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/10 hover:border-white/20"}`}
            >
              {analyzing ? (
                <div className="space-y-2">
                  <div className="mx-auto w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#d4af37]">AI analyzing frames & audio...</p>
                </div>
              ) : videoFile ? (
                <label className="cursor-pointer block">
                  <p className="text-sm text-[#fdfbf7]/40">Drop another video or click to replace</p>
                  <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              ) : (
                <label className="cursor-pointer block">
                  <p className="text-2xl mb-2">{'\uD83C\uDFAC'}</p>
                  <p className="text-base text-[#fdfbf7]/35 font-medium">Drop a video to analyze</p>
                  <p className="text-xs text-[#fdfbf7]/18 mt-1">MP4, MOV — up to 5 min</p>
                  <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              )}
            </div>

            {scenes.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex rounded-full border border-white/10 bg-[#121214] p-1">
                  <button onClick={selectAll} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 hover:text-[#fdfbf7] transition">All</button>
                  <button onClick={deselectAll} className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 hover:text-[#fdfbf7] transition">None</button>
                </div>
                <select value={transition} onChange={e => setTransition(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="cut">Cut</option>
                  <option value="fade">Fade</option>
                </select>
                <span className="text-[10px] text-[#fdfbf7]/25">{selectedCount} scenes · {fmtTime(totalDuration)} total</span>
              </div>
            )}

            <button onClick={renderVideo} disabled={rendering || selectedCount === 0}
              className="w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] hover:bg-[#f0d36b] disabled:opacity-20 transition relative overflow-hidden">
              {rendering ? (
                <span className="flex items-center justify-center gap-2">
                  Rendering {renderProgress}%
                  <span className="inline-block w-3 h-3 border-2 border-[#121214] border-t-transparent rounded-full animate-spin" />
                </span>
              ) : `Render ${selectedCount} Scenes`}
            </button>
          </div>

          <div className="border border-white/10 bg-[#121214] rounded-2xl overflow-hidden">
            {scenes.length > 0 ? (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">{scenes.length} scenes</p>
                  <p className="text-[10px] text-[#fdfbf7]/25">Drag to reorder</p>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {scenes.map((s, i) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveScene(dragIdx, i); setDragIdx(null); }}
                      onDragEnd={() => setDragIdx(null)}
                      className={`group rounded-xl overflow-hidden border transition-all ${s.selected ? "border-[#d4af37]/30 bg-[#1a2332]" : "border-white/5 bg-[#0c0d10] opacity-40 hover:opacity-70"}`}
                    >
                      <div className="flex">
                        {s.frameUrl && (
                          <div
                            className="w-24 h-16 shrink-0 bg-cover bg-center cursor-pointer relative"
                            style={{ backgroundImage: `url(${s.frameUrl})` }}
                            onMouseEnter={() => hoverScene(s.start)}
                            onClick={() => playScene(s.start)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                              <span className="text-white text-lg">{'\u25B6'}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleScene(s.id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${s.selected ? "border-[#d4af37] bg-[#d4af37]" : "border-white/20"}`}>
                              {s.selected && <span className="text-[8px] text-[#121214] font-bold">{'\u2713'}</span>}
                            </button>
                            <span className="text-[11px] font-semibold truncate">{s.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => adjustDuration(s.id, -1)} className="text-[10px] text-[#d4af37]/40 hover:text-[#d4af37] cursor-pointer select-none" title="Shorten">{'\u25C0'}</button>
                            <span className="text-[10px] text-[#d4af37] font-mono">{fmtTime(s.start)} - {fmtTime(s.end)}</span>
                            <button onClick={() => adjustDuration(s.id, 1)} className="text-[10px] text-[#d4af37]/40 hover:text-[#d4af37] cursor-pointer select-none" title="Extend">{'\u25B6'}</button>
                            <span className="text-[9px] text-[#fdfbf7]/20">{s.visual_clue}</span>
                            <span className="ml-auto text-[10px] font-bold text-[#d4af37]">{s.hook.score}</span>
                          </div>
                          <p className="text-[10px] text-[#fdfbf7]/35 mt-1 italic truncate">&ldquo;{s.hook.text}&rdquo;</p>
                          <input
                            type="text" value={s.text} onChange={e => setScenes(prev => prev.map(x => x.id === s.id ? { ...x, text: e.target.value } : x))}
                            placeholder="Add text overlay for this scene..."
                            className="mt-2 w-full bg-black/30 border border-white/5 px-2.5 py-1.5 text-[10px] text-[#fdfbf7]/50 outline-none focus:border-[#d4af37]/40 rounded-lg placeholder:text-[#fdfbf7]/12"
                          />
                        </div>
                        <button onClick={() => copyHook(s.hook.text)}
                          className="shrink-0 w-8 flex items-center justify-center text-[10px] text-[#d4af37]/30 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition">
                          {copied === s.hook.text ? "{'\u2713'}" : "{'\uD83D\uDCCB'}"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
                <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-5">
                  <span className="text-2xl">{'\uD83C\uDFAC'}</span>
                </div>
                <p className="text-sm text-[#fdfbf7]/20">No scenes yet</p>
                <p className="text-xs text-[#fdfbf7]/10 mt-1">Drop a video on the left to detect scenes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function copyHook(text: string) {
  try { navigator.clipboard.writeText(text); } catch {}
}
