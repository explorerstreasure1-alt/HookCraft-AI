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
};

function extractFrames(file: File, count: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true;
    const url = URL.createObjectURL(file); video.src = url;
    video.onloadedmetadata = async () => {
      const duration = Math.min(video.duration, 300);
      const interval = duration / count;
      const frames: string[] = [];
      const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext("2d")!;
      for (let i = 0; i < count; i++) {
        video.currentTime = Math.min(i * interval, duration - 0.1);
        await new Promise<void>(r => { video.onseeked = () => r(); });
        ctx.drawImage(video, 0, 0, 320, 180);
        frames.push(canvas.toDataURL("image/jpeg", 0.5));
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

export default function KeyScenes() {
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [copied, setCopied] = useState("");
  const [rendering, setRendering] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioDataRef = useRef<Float32Array | null>(null);

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
      const [audioArr, audioB64] = isVideo ? await Promise.all([extractAudio(file), extractAudio(file).then(audioToBase64)]) : [new Float32Array(), ""];
      if (isVideo) audioDataRef.current = audioArr;

      const ab64 = isVideo ? audioB64 : await (async () => {
        return new Promise<string>(r => { const rd = new FileReader(); rd.onload = () => r((rd.result as string).split(",")[1]); rd.readAsDataURL(file); });
      })();

      const tr = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: ab64, type: isVideo ? "video" : "audio" }) });
      const td = await tr.json();
      if (!td.text) { showToast("No speech detected.", "info"); setAnalyzing(false); return; }

      let frames: string[] = [];
      if (isVideo) frames = await extractFrames(file, 10);

      showToast("Analyzing scenes visually...", "info");
      const sr = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frames, transcript: td.text }) });
      const sd = await sr.json();

      if (sd.scenes?.length) {
        const parsed: Scene[] = sd.scenes.map((s: { start: string; end: string; title: string; visual_clue: string; hook: { text: string; score: number } }, i: number) => ({
          id: i, start: parseTime(s.start), end: parseTime(s.end), title: s.title,
          visual_clue: s.visual_clue, hook: s.hook, selected: true, text: "",
        }));
        setScenes(parsed);
        showToast(`${parsed.length} scenes detected!`, "success");
      } else showToast("No scenes found.", "info");
    } catch { showToast("Analysis failed.", "info"); }
    finally { setAnalyzing(false); }
  }

  function hoverScene(start: number) {
    if (videoRef.current) { videoRef.current.currentTime = start; videoRef.current.play().catch(() => {}); }
  }

  function toggleScene(id: number) {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  }

  function moveScene(from: number, to: number) {
    setScenes(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  async function renderVideo() {
    const selected = scenes.filter(s => s.selected);
    if (selected.length === 0 || !videoFile) return;
    setRendering(true);

    try {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.muted = true;
      await new Promise<void>(r => { video.onloadedmetadata = () => r(); });

      const totalDuration = selected.reduce((sum, s) => sum + (s.end - s.start), 0);
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 360;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(30);
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      recorder.ondataavailable = e => chunks.push(e.data);

      const done = new Promise<void>(r => { recorder.onstop = () => r(); });
      recorder.start();

      for (const scene of selected) {
        video.currentTime = scene.start;
        await new Promise<void>(r => { video.onseeked = () => r(); });

        const sceneDuration = scene.end - scene.start;
        const frames = Math.ceil(sceneDuration * 30);
        const startTime = performance.now();

        for (let f = 0; f < frames; f++) {
          const targetTime = startTime + (f / 30) * 1000;
          video.currentTime = scene.start + f / 30;
          await new Promise<void>(r => { video.onseeked = () => r(); });
          ctx.drawImage(video, 0, 0, 640, 360);
          if (scene.text) {
            ctx.fillStyle = "white";
            ctx.font = "bold 28px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(scene.text, 320, 330);
          }
          const delay = targetTime - performance.now();
          if (delay > 0) await new Promise(r => setTimeout(r, delay));
        }
      }

      recorder.stop();
      await done;

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `hookcraft-scenes-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
      showToast("Video rendered!", "success");
    } catch { showToast("Render failed.", "info"); }
    finally { setRendering(false); }
  }

  return (
    <section id="keyscenes" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Scene Editor</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">AI finds scenes. You edit. One click render.</h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">Detect scene changes visually. Select, reorder, add text. Export as a single video.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            {videoUrl && (
              <video ref={videoRef} src={videoUrl} controls className="w-full rounded-xl bg-black max-h-[300px]" />
            )}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`mt-3 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/10 hover:border-white/20"}`}
            >
              {analyzing ? <p className="text-sm text-[#d4af37] animate-pulse">{'\uD83C\uDFAC'} Analyzing video...</p> : (
                <label className="cursor-pointer block">
                  <p className="text-sm text-[#fdfbf7]/35">Drop video here</p>
                  <input type="file" accept="video/*,audio/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              )}
            </div>

            {scenes.length > 0 && (
              <button onClick={renderVideo} disabled={rendering || scenes.filter(s => s.selected).length === 0}
                className="mt-4 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] hover:bg-[#f0d36b] disabled:opacity-30 transition">
                {rendering ? "Rendering..." : `Render ${scenes.filter(s => s.selected).length} Scenes`}
              </button>
            )}
          </div>

          <div className="border border-[#d4af37]/24 bg-[#121214] p-5 rounded-2xl max-h-[600px] overflow-y-auto">
            {scenes.length > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37] mb-4">{scenes.length} scenes detected</p>
                <div className="space-y-2">
                  {scenes.map((s, i) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveScene(dragIdx, i); setDragIdx(null); }}
                      className={`border p-3 rounded-lg cursor-pointer group transition ${s.selected ? "border-[#d4af37]/40 bg-[#1a2332]" : "border-white/10 bg-[#0c0d10] opacity-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleScene(s.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${s.selected ? "border-[#d4af37] bg-[#d4af37]" : "border-white/20"}`}>
                          {s.selected && <span className="text-[10px] text-[#121214] font-bold">&#10003;</span>}
                        </button>
                        <div
                          className="flex-1 min-w-0"
                          onMouseEnter={() => hoverScene(s.start)}
                        >
                          <p className="text-xs font-semibold truncate">{s.title}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-[10px] text-[#d4af37]">{fmtTime(s.start)}-{fmtTime(s.end)}</span>
                            <span className="text-[10px] text-[#fdfbf7]/25">{s.visual_clue}</span>
                          </div>
                          <p className="text-[11px] text-[#fdfbf7]/50 mt-1 italic truncate">&ldquo;{s.hook.text}&rdquo;</p>
                        </div>
                        <span className="text-xs font-bold text-[#d4af37] shrink-0">{s.hook.score}</span>
                      </div>
                      <input
                        type="text"
                        value={s.text}
                        onChange={e => setScenes(prev => prev.map(x => x.id === s.id ? { ...x, text: e.target.value } : x))}
                        placeholder="Add text overlay..."
                        className="mt-2 w-full bg-[#121214] border border-white/10 px-3 py-1.5 text-xs text-[#fdfbf7] outline-none focus:border-[#d4af37]/60 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <p className="text-4xl mb-4">{'\uD83C\uDFAC'}</p>
                <p className="text-sm text-[#fdfbf7]/30">Drop a video to detect scenes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
