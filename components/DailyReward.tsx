"use client";

import { useEffect, useState } from "react";
import { showToast } from "./Toast";

type RewardData = {
  credits: number;
  xp: number;
  level: number;
  streak: number;
  nextLevelXp: number;
  xpProgress: number;
  canSpin: boolean;
  dailyReward: { credits: number; xp: number };
  questsCompleted: number;
  totalGenerations: number;
};

export default function DailyReward() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<RewardData | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!sessionStorage.getItem("hc_daily_claimed")) {
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_daily" }),
      });
      const result = await res.json();
      if (result.success) {
        setClaimed(true);
        sessionStorage.setItem("hc_daily_claimed", "1");
        showToast(`+${result.credits} credits, +${result.xp} XP claimed!`, "success");
        if (result.leveledUp) {
          setTimeout(() => showToast(`Level Up! You're now Level ${result.newLevel}`, "success"), 1500);
        }
        window.dispatchEvent(new Event("credits-updated"));
      }
    } catch {
      showToast("Failed to claim reward", "info");
    }
    setClaiming(false);
  }

  if (!data || !open) return null;

  const streakDays = Array.from({ length: 7 }, (_, i) => i + 1);
  const currentStreak = Math.min(data.streak, 7);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/20 to-transparent blur-2xl rounded-3xl" />
        <div className="relative border-2 border-[#d4af37]/50 bg-gradient-to-b from-[#1a1510] to-[#0a0a0f] rounded-3xl p-6 shadow-[0_0_60px_rgba(212,175,55,0.3)]">
          <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-3xl">🔥</span>
              <span className="text-[#d4af37] font-black text-xl">Day {data.streak}</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Daily Reward</h2>
            <p className="text-zinc-400 text-sm">Keep your streak alive for bigger rewards!</p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {streakDays.map((day) => (
              <div
                key={day}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  day <= currentStreak
                    ? "bg-gradient-to-br from-[#d4af37] to-[#8b6914] text-[#0a0a0f] shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                    : "bg-zinc-800/50 text-zinc-600 border border-zinc-700/50"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-4 mb-4 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Today's Reward</span>
              <span className="text-[#d4af37] text-xs font-bold">STREAK x{data.streak}</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-[#d4af37]">+{data.dailyReward.credits}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Credits</div>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-center">
                <div className="text-3xl font-black text-purple-400">+{data.dailyReward.xp}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">XP</div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-400">Level {data.level}</span>
              <span className="text-xs text-zinc-500">{data.xp}/{data.nextLevelXp} XP</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-[#d4af37] rounded-full transition-all duration-500"
                style={{ width: `${data.xpProgress}%` }}
              />
            </div>
          </div>

          {!claimed ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full gold-shimmer py-4 text-sm font-bold rounded-xl disabled:opacity-50"
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                  Claiming...
                </span>
              ) : (
                "Claim Reward"
              )}
            </button>
          ) : (
            <div className="text-center py-4">
              <div className="text-[#d4af37] font-bold text-lg mb-1">Reward Claimed!</div>
              <p className="text-zinc-400 text-sm">Come back tomorrow for more</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
            <span>🎡 Spin: {data.canSpin ? "Ready!" : "24h cooldown"}</span>
            <span>📋 Quests: {data.questsCompleted}/3</span>
          </div>
        </div>
      </div>
    </div>
  );
}