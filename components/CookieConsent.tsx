"use client";

import { useState } from "react";

export default function CookieConsent() {
  const [hidden, setHidden] = useState(
    typeof localStorage !== "undefined" && localStorage.getItem("cookies-accepted") === "1"
  );

  function accept() {
    localStorage.setItem("cookies-accepted", "1");
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[200] p-4 pointer-events-none animate-fade-up" style={{ animationDelay: "2s" }}>
      <div className="glass-light rounded-2xl p-4 max-w-lg mx-auto flex items-center gap-4 pointer-events-auto flex-col sm:flex-row shadow-[0_-8px_40px_rgba(0,0,0,0.3)]">
        <p className="text-xs text-zinc-400 flex-1 leading-relaxed">
          We use cookies for authentication and to improve your experience. No tracking, no ads.
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-white text-[#0a0a0f] font-semibold px-4 py-2 rounded-full text-xs hover:bg-[#d4af37] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
