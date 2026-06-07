"use client";

import { useRef, useState } from "react";
import { showToast } from "./Toast";

type Scene = {
  start: string;
  end: string;
  title: string;
  visual_clue: string;
  hook: { text: string; score: number };
};

function extractFrames(file: File, count: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = Math.min(video.duration, 300);
      const interval = duration / count;
      const frames: string[] = [];
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d")!;

      for (let i = 0; i < count; i++) {
        video.currentTime = Math.min(i * interval, duration - 0.1);
        await new Promise<void>((r) => { video.onseeked = () => r(); });
        ctx.drawImage(video, 0, 0, 320, 180);
        frames.push(canvas.toDataURL("image/jpeg", 0.6));
      }

      URL.revokeObjectURL(url);
      video.remove();
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };
  });
}

async function extractAudio(file: File): Promise<string> {
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

  const wav = new ArrayBuffer(44 + rendered.length * 2);
  const view = new DataView(wav);
  function ws(o: number, s: string) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }
  ws(0, "RIFF"); view.setUint32(4, wav.byteLength - 8, true); ws(8, "WAVE"); ws(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); ws(36, "data"); view.setUint32(40, rendered.length * 2, true);
  const data = rendered.getChannelData(0);
  let off = 44;
  for (let i = 0; i < data.length; i++) {
    view.setInt16(off, Math.max(-1, Math.min(1, data[i])) * 0x7FFF, true);
    off += 2;
  }
  const bytes = new Uint8Array(wav);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export default function KeyScenes() {
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [copied, setCopied] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return;
    setAnalyzing(true); setScenes([]); setTranscript(""); setVideoFile(null);

    try {
      const isVideo = file.type.startsWith("video/");
      if (isVideo) setVideoFile(file);

      const audioBase64 = isVideo ? await extractAudio(file) : await toBase64(file);
      const r = await fetch("/api/transcribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: audioBase64, type: isVideo ? "video" : "audio" }),
      });
      const d = await r.json();
      if (d.text) { setTranscript(d.text); showToast("Ready! Find scenes now.", "success"); }
      else showToast("No speech detected.", "info");
    } catch { showToast("Analysis failed.", "info"); }
    finally { setAnalyzing(false); }
  }

  async function findKeyScenes() {
    if (loading) return;
    setLoading(true);
    try {
      let frames: string[] = [];
      if (videoFile) frames = await extractFrames(videoFile, 10);

      const body: Record<string, unknown> = { transcript };
      if (frames.length > 0) body.frames = frames;

      const r = await fetch("/api/scenes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.scenes?.length) { setScenes(d.scenes); showToast(`${d.scenes.length} scenes detected!`, "success"); }
      else showToast("No scenes found. Try a different video.", "info");
    } catch { showToast("Scene detection failed.", "info"); }
    finally { setLoading(false); }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(""), 1400); } catch {}
  }

  return (
    <section id="keyscenes" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Scene Detective</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            AI watches your video. Finds every scene change.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            Visual + audio analysis. Detects camera switches, location changes, new speakers. Each scene gets a viral hook.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            {videoFile && (
              <video ref={videoRef} src={URL.createObjectURL(videoFile)} controls className="w-full rounded-xl mb-4 max-h-[200px] object-cover" />
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onPaste={(e) => { const f = e.clipboardData.files[0]; if (f) { e.preventDefault(); handleFile(f); } }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${dragOver ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/10 hover:border-white/20"}`}
            >
              {analyzing ? (
                <div>
                  <p className="text-3xl mb-3 animate-pulse">&#x1F3AC;</p>
                  <p className="text-sm text-[#d4af37]">Extracting frames + audio...</p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <p className="text-3xl mb-4">&#x1F3AC;</p>
                  <p className="text-base text-[#fdfbf7]/40">Drop a video here</p>
                  <p className="text-xs text-[#fdfbf7]/18 mt-2">AI watches every frame. Up to 5 min.</p>
                  <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              )}
            </div>

            {transcript && (
              <div className="mt-6 border border-[#d4af37]/20 bg-gradient-to-r from-[#1a2332]/80 to-[#121214] p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">&#x1F4DD;</span>
                  <div>
                    <p className="text-sm font-semibold">Video analyzed</p>
                    <p className="text-[10px] text-[#fdfbf7]/30">AI watches frames + listens to audio</p>
                  </div>
                </div>
                <p className="text-xs text-[#fdfbf7]/40 line-clamp-2 mb-5">{transcript.slice(0, 200)}</p>
                <button onClick={findKeyScenes} disabled={loading}
                  className="w-full rounded-full bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#121214] hover:bg-[#f0d36b] disabled:opacity-40 transition">
                  {loading ? "Detecting scenes..." : "Detect Scenes (3 credits)"}
                </button>
              </div>
            )}
          </div>

          <div className="border border-[#d4af37]/24 bg-[#121214] p-6 shadow-[0_0_60px_rgba(212,175,55,0.08)] rounded-2xl">
            {scenes.length > 0 ? (
              <div className="space-y-4">
                <div className="mb-5 border-b border-white/10 pb-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Scenes detected</p>
                  <p className="mt-2 text-lg font-semibold">{scenes.length} scene changes found</p>
                </div>
                {scenes.map((s, i) => (
                  <div key={i} className="border border-[#d4af37]/30 bg-[#1a2332]/40 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-[#d4af37]">{s.title}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-[#fdfbf7]/25">{s.start} - {s.end}</span>
                          <span className="text-[10px] text-[#d4af37]/40">{s.visual_clue}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#d4af37]">{s.hook.score}</span>
                    </div>
                    <p className="text-sm leading-6 text-[#fdfbf7]/80">{s.hook.text}</p>
                    <button onClick={() => copyText(s.hook.text)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === s.hook.text ? "Copied" : "Copy hook"}</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <p className="text-4xl mb-4">&#x1F50D;</p>
                <p className="text-sm text-[#fdfbf7]/30">Drop a video to detect scenes</p>
                <p className="text-xs text-[#fdfbf7]/15 mt-2">Visual + audio scene detection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
}
