"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function fetchCredits() {
    fetch("/api/credits").then(r => r.json()).then((d: { credits: number }) => setCredits(d.credits)).catch(() => {});
  }

  function fetchProfile() {
    fetch("/api/rewards").then(r => r.json()).then((d) => {
      setStreak(d.streak || 0);
      setLevel(d.level || 1);
    }).catch(() => {});
  }

  useEffect(() => {
    fetchCredits();
    fetchProfile();
    const i = setInterval(fetchCredits, 30000);
    function onVisible() { if (document.visibilityState === "visible") { fetchCredits(); fetchProfile(); } }
    function onScroll() { setScrolled(window.scrollY > 20); }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("credits-updated", fetchCredits);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("credits-updated", fetchCredits);
    };
  }, [user]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass shadow-[0_4px_40px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative">
            <div className="absolute inset-[-2px] bg-[#d4af37] blur-md opacity-40 rounded-lg group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8b6914] flex items-center justify-center text-[#0a0a0f] font-black text-base shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-shadow duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <span className="font-black text-white tracking-tight text-lg">
            HookCraft <span className="text-[#d4af37]">AI</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
          {[
            { label: "Dashboard", href: "#dashboard" },
            { label: "Auditor", href: "#auditor" },
            { label: "Deconstructor", href: "#deconstructor" },
            { label: "PowerLab", href: "#powerlab" },
            { label: "DNA", href: "#dna" },
            { label: "Scene Editor", href: "#keyscenes" },
            { label: "Pricing", href: "#pricing" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative py-1 hover:text-white transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#d4af37] rounded-full group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          {streak > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#1E1E18] border border-orange-500/25 rounded-xl px-2.5 py-1.5 transition-all duration-300 hover:border-orange-500/45">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-orange-400 font-mono">{streak}</span>
            </span>
          )}

          {/* Level badge */}
          {level > 1 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#1E1E18] border border-purple-500/25 rounded-xl px-2.5 py-1.5 transition-all duration-300 hover:border-purple-500/45">
              <span className="text-sm">⭐</span>
              <span className="text-xs font-bold text-purple-400 font-mono">Lv{level}</span>
            </span>
          )}

          {/* Credits badge */}
          {credits !== null && (
            <span className="hidden sm:inline-flex items-center gap-2 bg-[#1E1E18] border border-[rgba(201,162,39,0.25)] rounded-xl px-3 py-1.5 transition-all duration-300 hover:border-[rgba(201,162,39,0.45)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227] shadow-[0_0_6px_rgba(201,162,39,0.5)]" />
              <span className="text-xs font-bold text-[#C9A227] font-mono">{credits}</span>
            </span>
          )}

          {/* Auth */}
          {user ? (
            <button
              onClick={signOut}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <a
              href="/auth"
              className="gold-shimmer px-5 py-2 text-xs font-bold"
            >
              Sign In
            </a>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col gap-1 p-2 md:hidden cursor-pointer group"
            aria-label="Toggle menu"
          >
            <span className={`block h-[2px] w-5 bg-zinc-400 rounded transition-all duration-300 ${mobileOpen ? "translate-y-[6px] rotate-45 bg-white" : "group-hover:bg-white"}`} />
            <span className={`block h-[2px] w-5 bg-zinc-400 rounded transition-all duration-300 ${mobileOpen ? "opacity-0" : "group-hover:bg-white"}`} />
            <span className={`block h-[2px] w-5 bg-zinc-400 rounded transition-all duration-300 ${mobileOpen ? "-translate-y-[6px] -rotate-45 bg-white" : "group-hover:bg-white"}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass border-t border-[rgba(201,162,39,0.1)] px-6 py-4 flex flex-col gap-3">
          {[
            { label: "Dashboard", href: "#dashboard" },
            { label: "Auditor", href: "#auditor" },
            { label: "Deconstructor", href: "#deconstructor" },
            { label: "PowerLab", href: "#powerlab" },
            { label: "DNA", href: "#dna" },
            { label: "Scene Editor", href: "#keyscenes" },
            { label: "Pricing", href: "#pricing" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
