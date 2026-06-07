"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d: { credits: number }) => setCredits(d.credits))
      .catch(() => {});
  }, [user]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#121214]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#hero" className="text-sm font-semibold uppercase tracking-[0.34em] text-[#fdfbf7]">
          HookCraft AI
        </a>
        <div className="hidden items-center gap-7 text-xs uppercase tracking-[0.22em] text-[#fdfbf7]/62 md:flex">
          <a className="transition hover:text-[#d4af37]" href="#architecture">Architecture</a>
          <a className="transition hover:text-[#d4af37]" href="#dashboard">Dashboard</a>
          <a className="transition hover:text-[#d4af37]" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          {credits !== null && (
            <span className="hidden rounded-full border border-[#d4af37]/30 bg-[#d4af37]/8 px-3 py-1 text-xs font-semibold text-[#d4af37] sm:inline">
              {credits} credits
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
