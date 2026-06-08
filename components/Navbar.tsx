"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  function fetchCredits() {
    fetch("/api/credits").then(r => r.json()).then((d: { credits: number }) => setCredits(d.credits)).catch(() => {});
  }

  useEffect(() => {
    fetchCredits();
    const i = setInterval(fetchCredits, 30000);
    function onVisible() { if (document.visibilityState === "visible") fetchCredits(); }
    function onScroll() { setScrolled(window.scrollY > 20); }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("credits-updated", fetchCredits);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("credits-updated", fetchCredits);
    };
  }, [user]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "glass shadow-[0_4px_30px_rgba(0,0,0,0.3)]" : "bg-transparent"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#c49b29] flex items-center justify-center text-[#0a0a0f] font-black text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            H
          </div>
          <span className="font-black text-white tracking-tight text-lg">HookCraft <span className="text-[#d4af37]">AI</span></span>
        </a>

        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
          <a className="hover:text-white transition-colors" href="#dashboard">Dashboard</a>
          <a className="hover:text-white transition-colors" href="#keyscenes">Scene Editor</a>
          <a className="hover:text-white transition-colors" href="#pricing">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          {credits !== null && (
            <span className="hidden sm:inline-flex items-center gap-2 glass-light rounded-full px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
              <span className="text-xs font-bold text-[#d4af37]">{credits}</span>
            </span>
          )}
          {user ? (
            <button onClick={signOut} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign Out
            </button>
          ) : (
            <a href="/auth" className="bg-white text-[#0a0a0f] font-semibold px-5 py-2 rounded-full text-sm hover:bg-[#d4af37] transition-all">
              Sign In
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
