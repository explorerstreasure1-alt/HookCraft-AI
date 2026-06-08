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
  const [filter, setFilter] = useState("none");
  const [speed, setSpeed] = useState(1);
  const [resolution, setResolution] = useState("640");
  const [textAnim, setTextAnim] = useState("static");
  const [sceneBackup, setSceneBackup] = useState<Scene[] | null>(null);
  const [muted, setMuted] = useState(false);
  const [textSize, setTextSize] = useState("medium");
  const [aspect, setAspect] = useState("9:16");
  const [activeScene, setActiveScene] = useState<number | null>(null);
  const [textColor, setTextColor] = useState("white");
  const [textPos, setTextPos] = useState("bottom");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); if (videoRef.current) videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("hookcraft-settings");
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.transition) setTransition(d.transition);
        if (d.filter) setFilter(d.filter);
        if (d.textAnim) setTextAnim(d.textAnim);
        if (d.textSize) setTextSize(d.textSize);
        if (d.textColor) setTextColor(d.textColor);
        if (d.textPos) setTextPos(d.textPos);
        if (d.resolution) setResolution(d.resolution);
        if (d.speed) setSpeed(d.speed);
        if (d.aspect) setAspect(d.aspect);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.style.filter = filter === "none" ? "none" : filter === "bw" ? "grayscale(100%)" : filter === "warm" ? "sepia(60%)" : "none";
  }, [filter]);

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

  function saveBackup() { setSceneBackup([...scenes]); }

  async function previewEdit() {
    const selected = scenes.filter(s => s.selected);
    if (!videoRef.current || selected.length === 0) return;
    videoRef.current.currentTime = selected[0].start;
    videoRef.current.play();
    const totalMs = selected.reduce((s, sc) => s + (sc.end - sc.start), 0) * 1000;
    setTimeout(() => videoRef.current?.pause(), totalMs + 500);
  }

  function hoverScene(start: number) { if (videoRef.current) { videoRef.current.currentTime = start; } }
  function playScene(start: number) { if (videoRef.current) { videoRef.current.currentTime = start; videoRef.current.play().catch(() => {}); } }

  function toggleScene(id: number) { saveBackup(); setScenes(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)); }
  function selectAll() { saveBackup(); setScenes(prev => prev.map(s => ({ ...s, selected: true }))); }
  function deselectAll() { saveBackup(); setScenes(prev => prev.map(s => ({ ...s, selected: false }))); }

  function moveScene(from: number, to: number) { saveBackup();
    setScenes(prev => { const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
  }

  function mergeAdjacent(id: number) { saveBackup();
    setScenes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const a = prev[idx], b = prev[idx + 1];
      const merged: Scene = {
        ...a, end: b.end,
        title: `${a.title} + ${b.title}`,
        visual_clue: a.visual_clue,
        text: a.text || b.text,
        hook: a.hook.score >= b.hook.score ? a.hook : b.hook,
      };
      const arr = [...prev];
      arr.splice(idx, 2, merged);
      return arr;
    });
  }

  function duplicateScene(id: number) { saveBackup();
    setScenes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: Date.now(), title: prev[idx].title + " (copy)" };
      const arr = [...prev];
      arr.splice(idx + 1, 0, copy);
      return arr;
    });
  }

  function splitScene(id: number) { saveBackup();
    setScenes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const s = prev[idx];
      const mid = (s.start + s.end) / 2;
      const a: Scene = { ...s, id: Date.now(), end: mid, title: s.title + " Pt1" };
      const b: Scene = { ...s, id: Date.now() + 1, start: mid, title: s.title + " Pt2", text: "", frameUrl: s.frameUrl };
      const arr = [...prev];
      arr.splice(idx, 1, a, b);
      return arr;
    });
  }

  function adjustDuration(id: number, delta: number) { saveBackup();
    setScenes(prev => prev.map(s => {
      if (s.id !== id) return s;
      const dt = s.end - s.start;
      const newDt = clamp(dt + delta, 1, 60);
      return { ...s, end: s.start + newDt };
    }));
  }

  async function downloadScene(id: number) {
    const scene = scenes.find(s => s.id === id);
    if (!scene || !videoRef.current || !videoFile) return;
    const video = videoRef.current;
    const startTime = scene.start;
    const duration = scene.end - scene.start;
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(30);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    recorder.ondataavailable = e => chunks.push(e.data);
    const done = new Promise<void>(r => { recorder.onstop = () => r(); });
    recorder.start();
    const frames = Math.ceil(duration * 30);
    for (let f = 0; f < frames; f++) {
      video.currentTime = startTime + f / 30;
      await new Promise<void>(r => { video.onseeked = () => r(); });
      ctx.drawImage(video, 0, 0, 640, 360);
      await new Promise(r => setTimeout(r, 33));
    }
    recorder.stop(); await done;
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `scene-${scene.id}.webm`; a.click();
    URL.revokeObjectURL(url);
    showToast("Scene downloaded!", "success");
  }

  function saveProject() {
    const data = { scenes, transition, filter, textAnim, textSize, textColor, textPos, resolution, speed, aspect };
    localStorage.setItem("hookcraft-project", JSON.stringify(data));
    localStorage.setItem("hookcraft-settings", JSON.stringify({ transition, filter, textAnim, textSize, textColor, textPos, resolution, speed, aspect }));
    showToast("Project saved!", "success");
  }

  function loadProject() {
    const raw = localStorage.getItem("hookcraft-project");
    if (!raw) { showToast("No saved project.", "info"); return; }
    try {
      const data = JSON.parse(raw);
      setScenes(data.scenes || []);
      setTransition(data.transition || "cut");
      setFilter(data.filter || "none");
      setTextAnim(data.textAnim || "static");
      setTextSize(data.textSize || "medium");
      setResolution(data.resolution || "640");
      setSpeed(data.speed || 1);
      setTextColor(data.textColor || "white");
      setTextPos(data.textPos || "bottom");
      setAspect(data.aspect || "9:16");
    } catch { showToast("Failed to load.", "info"); }
  }

  async function renderVideo() {
    const selected = scenes.filter(s => s.selected);
    if (selected.length === 0 || !videoFile || !videoUrl) return;
    setRendering(true); setRenderProgress(0);
    try {
      const video = document.createElement("video");
      video.src = videoUrl; video.muted = true;
      await new Promise<void>(r => { video.onloadedmetadata = () => r(); });

      const [aw, ah] = aspect === "16:9" ? [1280, 720] : aspect === "1:1" ? [720, 720] : [720, 1280];
      const [w, h] = resolution === "1080" ? aspect === "9:16" ? [1080, 1920] : [1920, 1080] : resolution === "720" ? [aw, ah] : aspect === "9:16" ? [360, 640] : [640, 360];
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
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
            ctx.drawImage(video, 0, 0, w, h);
            ctx.globalAlpha = 1;
          if (scene.text) {
            ctx.filter = filter === "none" ? "none" : filter === "bw" ? "grayscale(100%)" : filter === "warm" ? "sepia(60%)" : "none";
            const textOpacity = textAnim === "fade" ? Math.min(1, f / 20) : 1;
            const yPos = textPos === "top" ? h * 0.12 : textPos === "center" ? h / 2 : h - 30;
            const ttY = textAnim === "slide" ? yPos + Math.max(0, 20 - f) : yPos;
            ctx.globalAlpha = textOpacity;
            ctx.fillStyle = textColor;
            ctx.font = `bold ${Math.round(w * (textSize === "small" ? 0.03 : textSize === "large" ? 0.06 : 0.044))}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = Math.round(w * 0.004);
            ctx.strokeText(scene.text, w / 2, ttY);
            ctx.fillText(scene.text, w / 2, ttY);
            ctx.globalAlpha = 1;
            ctx.filter = "none";
          }
            await new Promise(r => setTimeout(r, 33));
            renderedFrames++;
          }
        }

        const frames = Math.ceil((scene.end - scene.start) * 30);
        for (let f = 0; f < frames; f++) {
          video.currentTime = scene.start + f / 30;
          await new Promise<void>(r => { video.onseeked = () => r(); });
          ctx.drawImage(video, 0, 0, w, h);
          if (scene.text) {
            ctx.filter = filter === "none" ? "none" : filter === "bw" ? "grayscale(100%)" : filter === "warm" ? "sepia(60%)" : "none";
            const yPos = textPos === "top" ? h * 0.12 : textPos === "center" ? h / 2 : h - 30;
            ctx.fillStyle = textColor;
            ctx.font = `bold ${Math.round(w * (textSize === "small" ? 0.03 : textSize === "large" ? 0.06 : 0.044))}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = Math.round(w * 0.004);
            ctx.strokeText(scene.text, w / 2, yPos);
            ctx.fillText(scene.text, w / 2, yPos);
            ctx.filter = "none";
          }
          await new Promise(r => setTimeout(r, 33));
          renderedFrames++;
          setRenderProgress(Math.round((renderedFrames / totalFrames) * 100));
        }
      }

    recorder.stop(); await done;
    const blob = new Blob(chunks, { type: "video/webm" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = downloadUrl; a.download = `hookcraft-edit-${Date.now()}.webm`; a.click();

    const history = JSON.parse(localStorage.getItem("hc-renders") || "[]");
    history.unshift({ name: `hookcraft-edit-${Date.now()}.webm`, date: new Date().toISOString(), duration: fmtTime(totalDuration), scenes: selected.length });
    localStorage.setItem("hc-renders", JSON.stringify(history.slice(0, 5)));

    showToast("Video rendered! Download started.", "success");
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
                  <option value="slide">Slide</option>
                </select>
                <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="none">Normal</option>
                  <option value="bw">B&W</option>
                  <option value="warm">Warm</option>
                </select>
                <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="rounded-full border border-white/10 bg-[#121214] px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
                <select value={textAnim} onChange={e => setTextAnim(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="static">Text</option>
                  <option value="fade">Fade In</option>
                  <option value="slide">Slide Up</option>
                </select>
                <select value={textSize} onChange={e => setTextSize(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="small">S</option>
                  <option value="medium">M</option>
                  <option value="large">L</option>
                </select>
                <select value={textColor} onChange={e => setTextColor(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="white">White</option>
                  <option value="#d4af37">Gold</option>
                  <option value="black">Black</option>
                </select>
                <select value={textPos} onChange={e => setTextPos(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="bottom">Bot</option>
                  <option value="center">Mid</option>
                  <option value="top">Top</option>
                </select>
                <select value={aspect} onChange={e => setAspect(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                  <option value="1:1">1:1</option>
                </select>
                <select value={resolution} onChange={e => setResolution(e.target.value)} className="rounded-full border border-white/10 bg-[#121214] px-2 py-2 text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/50 outline-none">
                  <option value="640">360</option>
                  <option value="720">720</option>
                  <option value="1080">1080</option>
                </select>
                <span className="text-[10px] text-[#fdfbf7]/25">{selectedCount} scenes · {fmtTime(totalDuration)} total</span>
                <button onClick={() => { if (sceneBackup) { setScenes(sceneBackup); setSceneBackup(null); showToast("Undone!", "info"); } }} className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/20 hover:text-[#d4af37] transition disabled:opacity-0" disabled={!sceneBackup}>Undo</button>
                <button onClick={() => { saveBackup(); previewEdit(); }} className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/60 hover:text-[#d4af37] transition">{'\u25B6'} Preview</button>
                <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }} className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/20 hover:text-[#d4af37] transition">{muted ? 'Unmute' : 'Mute'}</button>
                <button onClick={saveProject} className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/40 hover:text-[#d4af37] transition">Save</button>
                <button onClick={loadProject} className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/40 hover:text-[#d4af37] transition">Load</button>
                <button onClick={() => { setVideoFile(null); setVideoUrl(""); setScenes([]); setSceneBackup(null); }} className="text-[10px] uppercase tracking-[0.15em] text-[#fdfbf7]/25 hover:text-red-400 transition">Reset</button>
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
                      <div className="flex flex-col sm:flex-row">
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
                              <button onClick={() => toggleScene(s.id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition cursor-pointer ${s.selected ? "border-[#d4af37] bg-[#d4af37]" : "border-white/20"}`}>
                                {s.selected && <span className="text-[8px] text-[#121214] font-bold">{'\u2713'}</span>}
                              </button>
                              <span className="text-[11px] font-semibold truncate">{s.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <button onClick={() => adjustDuration(s.id, -1)} className="text-[10px] text-[#d4af37]/40 hover:text-[#d4af37] cursor-pointer select-none" title="Shorten">{'\u25C0'}</button>
                              <span className="text-[10px] text-[#d4af37] font-mono whitespace-nowrap">{fmtTime(s.start)} - {fmtTime(s.end)}</span>
                              <button onClick={() => adjustDuration(s.id, 1)} className="text-[10px] text-[#d4af37]/40 hover:text-[#d4af37] cursor-pointer select-none" title="Extend">{'\u25B6'}</button>
                              <span className="text-[9px] text-[#fdfbf7]/20 truncate">{s.visual_clue}</span>
                              <span className="text-[10px] font-bold text-[#d4af37]">{s.hook.score}</span>
                            </div>
                            <p className="text-[10px] text-[#fdfbf7]/35 mt-1 italic truncate">&ldquo;{s.hook.text}&rdquo;</p>
                            <input
                              type="text" value={s.text} onChange={e => setScenes(prev => prev.map(x => x.id === s.id ? { ...x, text: e.target.value } : x))}
                              placeholder="Add text overlay..."
                              className="mt-2 w-full bg-black/30 border border-white/5 px-2.5 py-1.5 text-[10px] text-[#fdfbf7]/50 outline-none focus:border-[#d4af37]/40 rounded-lg placeholder:text-[#fdfbf7]/12"
                            />
                          </div>
                        </div>
                        <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-white/5 shrink-0">
                          <button onClick={() => { navigator.clipboard.writeText(s.hook.text); setCopied(s.hook.text); setTimeout(() => setCopied(""), 1400); }}
                            className="flex-1 sm:flex-initial h-8 sm:h-auto px-2 sm:px-0 flex items-center justify-center text-[10px] text-[#d4af37]/30 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition cursor-pointer" title="Copy hook">
                            {copied === s.hook.text ? '\u2713' : '\uD83D\uDCCB'}
                          </button>
                          <button onClick={() => duplicateScene(s.id)} title="Duplicate"
                            className="flex-1 sm:flex-initial h-8 sm:h-auto px-2 sm:px-0 flex items-center justify-center text-[10px] text-[#fdfbf7]/15 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition cursor-pointer">
                            {'\uD83D\uDD01'}
                          </button>
                          <button onClick={() => downloadScene(s.id)} title="Download"
                            className="flex-1 sm:flex-initial h-8 sm:h-auto px-2 sm:px-0 flex items-center justify-center text-[10px] text-[#fdfbf7]/10 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition cursor-pointer">
                            {'\u2B07'}
                          </button>
                          {i < scenes.length - 1 && (
                            <button onClick={() => mergeAdjacent(s.id)} title="Merge"
                              className="flex-1 sm:flex-initial h-8 sm:h-auto px-2 sm:px-0 flex items-center justify-center text-[10px] text-[#fdfbf7]/15 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition cursor-pointer">
                              {'\u2194'}
                            </button>
                          )}
                          <button onClick={() => splitScene(s.id)} title="Split"
                            className="flex-1 sm:flex-initial h-8 sm:h-auto px-2 sm:px-0 flex items-center justify-center text-[10px] text-[#fdfbf7]/10 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition cursor-pointer">
                            {'\u2702'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
                <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#1a2332]/50 flex items-center justify-center mb-6">
                  <span className="text-2xl">{'\uD83C\uDFAC'}</span>
                </div>
                <p className="text-sm text-[#fdfbf7]/20 font-medium mb-4">How it works</p>
                <div className="space-y-2 text-left max-w-[220px]">
                  {[
                    { n: "1", t: "Drop a video on the left" },
                    { n: "2", t: "AI detects scene changes" },
                    { n: "3", t: "Select, reorder, add text" },
                    { n: "4", t: "Render & download" },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full border border-[#d4af37]/20 flex items-center justify-center text-[9px] text-[#d4af37]/40 shrink-0">{s.n}</span>
                      <span className="text-[11px] text-[#fdfbf7]/12">{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
