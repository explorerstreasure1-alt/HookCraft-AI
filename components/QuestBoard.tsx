"use client";

import { useEffect, useState } from "react";
import { showToast } from "./Toast";

type Quest = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  credits: number;
  xp: number;
  action: string;
};

const QUESTS: Quest[] = [
  { id: "generate", title: "Create a Hook", desc: "Generate any hook or script", icon: "✨", credits: 30, xp: 15, action: "#dashboard" },
  { id: "audit", title: "Audit a Hook", desc: "Use the Hook Auditor tool", icon: "🔍", credits: 30, xp: 15, action: "#auditor" },
  { id: "deconstruct", title: "Deconstruct a Video", desc: "Extract a viral formula", icon: "🧬", credits: 30, xp: 15, action: "#deconstructor" },
  { id: "scenes", title: "Detect Scenes", desc: "Analyze key scenes in a video", icon: "🎬", credits: 30, xp: 15, action: "#keyscenes" },
  { id: "dna", title: "Discover Your DNA", desc: "Run Creator DNA analysis", icon: "🧪", credits: 30, xp: 15, action: "#dna" },
  { id: "powerlab", title: "Use PowerLab", desc: "Try any PowerLab tool", icon: "⚡", credits: 30, xp: 15, action: "#powerlab" },
];

export default function QuestBoard() {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((d) => setCompleted(d.questsCompleted || 0))
      .catch(() => {});
  }, []);

  async function handleComplete(quest: Quest) {
    setClaimingId(quest.id);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_quest" }),
      });
      const data = await res.json();
      if (data.success) {
        setCompleted(data.questsCompleted);
        showToast(`Quest done! +${data.credits} credits, +${data.xp} XP`, "success");
        if (data.leveledUp) {
          setTimeout(() => showToast(`Level Up! Level ${data.newLevel}`, "success"), 1500);
        }
        window.dispatchEvent(new Event("credits-updated"));
      } else {
        showToast(data.error || "Quest failed", "info");
      }
    } catch {
      showToast("Failed to complete quest", "info");
    }
    setClaimingId(null);
  }

  const maxQuests = 3;
  const remaining = Math.max(0, maxQuests - completed);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold px-4 py-3 rounded-full shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] transition-all duration-300 hover:scale-105"
      >
        <span className="text-xl">📋</span>
        <span className="text-sm">Daily Quests</span>
        {remaining > 0 && (
          <span className="bg-[#d4af37] text-[#0a0a0f] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
            {remaining}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent blur-2xl rounded-3xl" />
            <div className="relative border-2 border-purple-500/50 bg-gradient-to-b from-[#1a1020] to-[#0a0a0f] rounded-3xl p-6 shadow-[0_0_60px_rgba(147,51,234,0.3)]">
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-4">
                <h2 className="text-2xl font-black text-white mb-1">Daily Quests</h2>
                <p className="text-zinc-400 text-sm">Complete {maxQuests} quests daily for bonus rewards</p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-5">
                {Array.from({ length: maxQuests }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      i < completed
                        ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]"
                        : "bg-zinc-800/50 text-zinc-600 border border-zinc-700/50"
                    }`}
                  >
                    {i < completed ? "✓" : i + 1}
                  </div>
                ))}
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {QUESTS.map((quest) => {
                  const isCompleted = completed > QUESTS.indexOf(quest);
                  return (
                    <div
                      key={quest.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-purple-500/10 border-purple-500/30 opacity-60"
                          : "bg-zinc-900/50 border-zinc-800/50 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="text-2xl">{quest.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white">{quest.title}</div>
                        <div className="text-xs text-zinc-500">{quest.desc}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#d4af37] font-bold">+{quest.credits} credits</span>
                          <span className="text-[10px] text-purple-400 font-bold">+{quest.xp} XP</span>
                        </div>
                      </div>
                      {!isCompleted ? (
                        <button
                          onClick={() => {
                            handleComplete(quest);
                            setOpen(false);
                            setTimeout(() => {
                              const el = document.querySelector(quest.action);
                              el?.scrollIntoView({ behavior: "smooth" });
                            }, 300);
                          }}
                          disabled={claimingId === quest.id || remaining === 0}
                          className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {claimingId === quest.id ? "..." : "Go"}
                        </button>
                      ) : (
                        <span className="text-purple-400 text-lg">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {remaining === 0 && (
                <div className="mt-4 text-center py-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <p className="text-purple-300 text-sm font-bold">All quests completed! Come back tomorrow.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}