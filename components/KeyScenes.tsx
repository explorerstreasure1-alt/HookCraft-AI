"use client";

import { useState } from "react";
import { showToast } from "./Toast";

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
  const numChannels = 1, sampleRate = buffer.sampleRate, bitsPerSample = 16;
  const data = buffer.getChannelData(0);
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = data.length * (bitsPerSample / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wav = new ArrayBuffer(totalSize);
  const view = new DataView(wav);
  function ws(off: number, s: string) { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
  ws(0, "RIFF"); view.setUint32(4, totalSize - 8, true); ws(8, "WAVE"); ws(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true); view.setUint16(34, bitsPerSample, true);
  ws(36, "data"); view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  return wav;
}

type Moment = { title: string; timestamp: string; hook: { text: string; score: number } };

export default function KeyScenes() {
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [copied, setCopied] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return;
    setAnalyzing(true); setMoments([]);
    try {
      const audioBase64 = file.type.startsWith("video/") ? await extractAudio(file) : await toBase64(file);
      const type = file.type.startsWith("video/") ? "video" : "audio";
      const r = await fetch("/api/transcribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: audioBase64, type }),
      });
      const d = await r.json();
      if (d.text) { setTranscript(d.text); showToast("Transcribed! Now find key scenes.", "success"); }
      else { setTranscript(""); showToast("No speech detected.", "info"); }
    } catch { showToast("Analysis failed.", "info"); }
    finally { setAnalyzing(false); }
  }

  async function findKeyScenes() {
    if (!transcript || loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "Video Analysis", platform: "TikTok", tone: "cinematic", mode: "moments", transcript }),
      });
      const d = await r.json();
      if (d.moments) { setMoments(d.moments); showToast(`${d.moments.length} key scenes found!`, "success"); }
    } catch { showToast("Failed to find scenes.", "info"); }
    finally { setLoading(false); }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(""), 1400); } catch {}
  }

  return (
    <section id="keyscenes" className="bg-[#0c0d10] px-5 py-24 text-[#fdfbf7] sm:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]">Key Scenes</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Drop a video. Find its most viral moments.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#fdfbf7]/68">
            AI transcribes your video and identifies 3-5 key scenes. Each scene gets a scroll-stopping hook.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onPaste={(e) => { const f = e.clipboardData.files[0]; if (f) { e.preventDefault(); handleFile(f); } }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${dragOver ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/10 hover:border-white/20"}`}
            >
              {analyzing ? (
                <div>
                  <p className="text-3xl mb-3 animate-pulse">🎙️</p>
                  <p className="text-sm text-[#d4af37]">Extracting audio & transcribing...</p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <p className="text-3xl mb-4">🎬</p>
                  <p className="text-base text-[#fdfbf7]/40">Drop a video or audio file</p>
                  <p className="text-xs text-[#fdfbf7]/18 mt-2">MP4, MOV, MP3, WAV — up to 5 min</p>
                  <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
              )}
            </div>

            {transcript && (
              <div className="mt-6 border border-[#d4af37]/20 bg-gradient-to-r from-[#1a2332]/80 to-[#121214] p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-sm font-semibold">Transcript ready</p>
                    <p className="text-[10px] text-[#fdfbf7]/30">Find the most viral-worthy scenes</p>
                  </div>
                </div>
                <p className="text-xs text-[#fdfbf7]/40 line-clamp-3 mb-5">{transcript}</p>
                <button onClick={findKeyScenes} disabled={loading}
                  className="w-full rounded-full bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#121214] hover:bg-[#f0d36b] disabled:opacity-40 transition">
                  {loading ? "Analyzing..." : "Find Key Scenes (3 credits)"}
                </button>
              </div>
            )}
          </div>

          <div className="border border-[#d4af37]/24 bg-[#121214] p-6 shadow-[0_0_60px_rgba(212,175,55,0.08)] rounded-2xl">
            {moments.length > 0 ? (
              <div className="space-y-4">
                <div className="mb-5 border-b border-white/10 pb-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Scenes found</p>
                  <p className="mt-2 text-lg font-semibold">{moments.length} key moments detected</p>
                </div>
                {moments.map((m, i) => (
                  <div key={i} className="border border-[#d4af37]/30 bg-[#1a2332]/40 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-[#d4af37]">{m.title}</p>
                        <p className="text-[10px] text-[#fdfbf7]/25 mt-0.5">~{m.timestamp}</p>
                      </div>
                      <span className="text-sm font-bold text-[#d4af37]">{m.hook.score}</span>
                    </div>
                    <p className="text-sm leading-6 text-[#fdfbf7]/80">{m.hook.text}</p>
                    <button onClick={() => copyText(m.hook.text)} className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 hover:text-[#f0d36b]">{copied === m.hook.text ? "Copied" : "Copy hook"}</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-sm text-[#fdfbf7]/30">Drop a video to find its key scenes</p>
                <p className="text-xs text-[#fdfbf7]/15 mt-2">Each scene gets a viral hook</p>
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
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}
