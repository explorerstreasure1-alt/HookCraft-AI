"use client";

import { useEffect, useState } from "react";

const shortcuts = [
  { keys: "Space", action: "Play / Pause video" },
  { keys: "Ctrl+V", action: "Paste screenshot to analyze" },
  { keys: "Drag & Drop", action: "Upload video or image" },
  { keys: "?", action: "Toggle shortcuts panel" },
  { keys: "Esc", action: "Close panels" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass rounded-2xl p-8 max-w-sm w-full animate-scale-in shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8b6914] flex items-center justify-center text-[#0a0a0f] font-black text-[10px]">
              ?
            </span>
            <h3 className="text-lg font-bold text-white">Shortcuts</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Esc
          </button>
        </div>
        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-zinc-400">{s.action}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono bg-zinc-800/80 text-zinc-300 rounded-lg border border-zinc-700/50">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-6 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px]">?</kbd> anytime to toggle
        </p>
      </div>
    </div>
  );
}
