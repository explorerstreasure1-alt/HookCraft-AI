"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  function fetchCredits() {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d: { credits: number }) => setCredits(d.credits))
      .catch(() => {});
  }

  useEffect(() => {
    fetchCredits();
    const i = setInterval(fetchCredits, 30000);
    function onVisible() {
      if (document.visibilityState === "visible") fetchCredits();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("credits-updated", fetchCredits);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("credits-updated", fetchCredits);
    };
  }, [user]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#121214]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#hero" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-[-0.04em] text-[#d4af37]">&#9851;</span>
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-[#fdfbf7]">HookCraft</span>
          <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-1.5 py-0.5 rounded">.AI</span>
        </a>
        <div className="hidden items-center gap-7 text-xs uppercase tracking-[0.22em] text-[#fdfbf7]/62 md:flex">
          <a className="transition hover:text-[#d4af37]" href="#architecture">Architecture</a>
          <a className="transition hover:text-[#d4af37]" href="#dashboard">Dashboard</a>
          <a className="transition hover:text-[#d4af37]" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          {credits !== null && (
            <span className="hidden items-center gap-2 rounded-full border border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/10 to-[#d4af37]/5 px-4 py-1.5 sm:inline-flex shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.7)] animate-pulse" />
              <span className="text-xs font-bold text-[#d4af37] tracking-[0.1em]">{credits}</span>
            </span>
          )}
          {user ? (
            <>
              <span className="hidden text-xs text-[#fdfbf7]/48 sm:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-full border border-[#d4af37]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37] transition hover:bg-[#d4af37] hover:text-[#121214]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <a
              href="/auth"
              className="rounded-full border border-[#d4af37]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37] transition hover:bg-[#d4af37] hover:text-[#121214]"
            >
              Sign In
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
