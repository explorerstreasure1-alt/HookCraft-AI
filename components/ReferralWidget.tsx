"use client";

import { useEffect, useState } from "react";
import { showToast } from "./Toast";

export default function ReferralWidget() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);
  const [credits, setCredits] = useState(0);
  const [inputCode, setInputCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        if (d.code) {
          setCode(d.code);
          setCount(d.count || 0);
          setCredits(d.credits || 0);
        }
      })
      .catch(() => {});
  }, []);

  function copyLink() {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast("Referral link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  async function applyCode() {
    if (!inputCode.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inputCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Referral applied! +${data.bonus} credits`, "success");
        setInputCode("");
        window.dispatchEvent(new Event("credits-updated"));
      } else {
        showToast(data.error || "Invalid code", "info");
      }
    } catch {
      showToast("Failed to apply code", "info");
    }
    setApplying(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold px-4 py-3 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all duration-300 hover:scale-105"
      >
        <span className="text-xl">🎁</span>
        <span className="text-sm">Refer & Earn</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-transparent blur-2xl rounded-3xl" />
            <div className="relative border-2 border-green-500/50 bg-gradient-to-b from-[#0a1a10] to-[#0a0a0f] rounded-3xl p-6 shadow-[0_0_60px_rgba(34,197,94,0.3)]">
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎁</div>
                <h2 className="text-2xl font-black text-white mb-1">Refer & Earn</h2>
                <p className="text-zinc-400 text-sm">Give 500 credits, get 500 credits!</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 text-center">
                  <div className="text-2xl font-black text-green-400">{count}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Friends</div>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 text-center">
                  <div className="text-2xl font-black text-[#d4af37]">{credits}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Credits Earned</div>
                </div>
              </div>

              {/* Your Code */}
              <div className="mb-6">
                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">Your Referral Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 font-mono text-lg text-[#d4af37] font-bold tracking-wider">
                    {code || "Loading..."}
                  </div>
                  <button
                    onClick={copyLink}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Share this link: <span className="text-green-400">{`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${code}`}</span></p>
              </div>

              {/* Apply Code */}
              <div className="border-t border-zinc-800/50 pt-4">
                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">Have a referral code?</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="HC-XXXXXX"
                    className="flex-1 bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 font-mono uppercase focus:border-green-500/50 outline-none"
                  />
                  <button
                    onClick={applyCode}
                    disabled={applying || !inputCode.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {applying ? "..." : "Apply"}
                  </button>
                </div>
              </div>

              <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <p className="text-xs text-green-300 text-center">
                  <span className="font-bold">How it works:</span> Share your code → Friend signs up and enters it → Both get 500 credits + 50 XP!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}