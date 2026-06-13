"use client";

import { useEffect, useState, useRef } from "react";
import { showToast } from "./Toast";

const PRIZES = [
  { label: "50", color: "#d4af37" },
  { label: "100", color: "#8b6914" },
  { label: "200", color: "#d4af37" },
  { label: "500", color: "#8b6914" },
  { label: "1000", color: "#d4af37" },
  { label: "25", color: "#8b6914" },
  { label: "75", color: "#d4af37" },
  { label: "150", color: "#8b6914" },
];

export default function SpinWheel() {
  const [open, setOpen] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ credits: number; xp: number; label: string } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((d) => setCanSpin(d.canSpin))
      .catch(() => {});
  }, []);

  async function handleSpin() {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);

    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "spin" }),
    });
    const data = await res.json();

    if (data.success) {
      const segmentAngle = 360 / PRIZES.length;
      const targetAngle = 360 - (data.prizeIndex * segmentAngle + segmentAngle / 2);
      const spins = 5;
      const finalRotation = rotation + spins * 360 + targetAngle - (rotation % 360);

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setCanSpin(false);
        setResult({ credits: data.credits, xp: data.xp, label: data.label });
        showToast(`You won ${data.label}!`, "success");
        if (data.leveledUp) {
          setTimeout(() => showToast(`Level Up! Level ${data.newLevel}`, "success"), 1500);
        }
        window.dispatchEvent(new Event("credits-updated"));
      }, 4500);
    } else {
      setSpinning(false);
      showToast(data.error || "Spin failed", "info");
    }
  }

  const segmentAngle = 360 / PRIZES.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#8b6914] text-[#0a0a0f] font-bold px-4 py-3 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all duration-300 hover:scale-105 animate-pulse"
        style={{ animationDuration: "3s" }}
      >
        <span className="text-xl">🎡</span>
        <span className="text-sm">Free Spin</span>
        {canSpin && <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/20 to-transparent blur-2xl rounded-3xl" />
            <div className="relative border-2 border-[#d4af37]/50 bg-gradient-to-b from-[#1a1510] to-[#0a0a0f] rounded-3xl p-6 shadow-[0_0_60px_rgba(212,175,55,0.3)]">
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-4">
                <h2 className="text-2xl font-black text-white mb-1">Lucky Spin</h2>
                <p className="text-zinc-400 text-sm">Spin daily for free credits!</p>
              </div>

              <div className="relative w-64 h-64 mx-auto mb-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                </div>

                <div
                  ref={wheelRef}
                  className="w-full h-full rounded-full border-4 border-[#d4af37]/60 shadow-[0_0_30px_rgba(212,175,55,0.3)] overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                  }}
                >
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {PRIZES.map((prize, i) => {
                      const startAngle = i * segmentAngle;
                      const endAngle = startAngle + segmentAngle;
                      const startRad = ((startAngle - 90) * Math.PI) / 180;
                      const endRad = ((endAngle - 90) * Math.PI) / 180;
                      const x1 = 100 + 100 * Math.cos(startRad);
                      const y1 = 100 + 100 * Math.sin(startRad);
                      const x2 = 100 + 100 * Math.cos(endRad);
                      const y2 = 100 + 100 * Math.sin(endRad);
                      const largeArc = segmentAngle > 180 ? 1 : 0;
                      const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
                      const textX = 100 + 60 * Math.cos(midAngle);
                      const textY = 100 + 60 * Math.sin(midAngle);
                      const textRotation = (startAngle + endAngle) / 2;

                      return (
                        <g key={i}>
                          <path
                            d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={prize.color}
                            stroke="#0a0a0f"
                            strokeWidth="1"
                          />
                          <text
                            x={textX}
                            y={textY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#0a0a0f"
                            fontSize="12"
                            fontWeight="bold"
                            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          >
                            {prize.label}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="100" cy="100" r="15" fill="#0a0a0f" stroke="#d4af37" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {result ? (
                <div className="text-center mb-4 animate-fade-up">
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="text-2xl font-black text-[#d4af37] mb-1">+{result.label} Credits!</div>
                  <div className="text-sm text-purple-400">+{result.xp} XP</div>
                </div>
              ) : null}

              <button
                onClick={handleSpin}
                disabled={spinning || !canSpin}
                className="w-full gold-shimmer py-4 text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {spinning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    Spinning...
                  </span>
                ) : canSpin ? (
                  "Spin Now!"
                ) : (
                  "Come Back Tomorrow"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}