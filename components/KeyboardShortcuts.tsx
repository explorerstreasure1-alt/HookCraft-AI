"use client";

import { useEffect, useState } from "react";

const shortcuts = [
  { keys: "Space", action: "Play / Pause video" },
  { keys: "Ctrl+V", action: "Paste screenshot to analyze" },
  { keys: "Drag & Drop", action: "Upload video or image" },
  { keys: "Esc", action: "Close this panel" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(p => !p);
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
      <div className="relative glass rounded-2xl p-8 max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Shortcuts</h3>
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-sm">Esc</button>
        </div>
        <div className="space-y-3">
          {shortcuts.map(s => (
            <div key={s.keys} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{s.action}</span>
              <kbd className="px-2 py-1 text-xs font-mono bg-zinc-800 text-zinc-300 rounded-md">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-6 text-center">Press <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px]">?</kbd> anytime to toggle</p>
      </div>
    </div>
  );
}
