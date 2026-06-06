"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#121214]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#hero" className="text-sm font-semibold uppercase tracking-[0.34em] text-[#fdfbf7]">
          HookCraft AI
        </a>
        <div className="hidden items-center gap-7 text-xs uppercase tracking-[0.22em] text-[#fdfbf7]/62 md:flex">
          <a className="transition hover:text-[#d4af37]" href="#architecture">
            Architecture
          </a>
          <a className="transition hover:text-[#d4af37]" href="#dashboard">
            Dashboard
          </a>
          <a className="transition hover:text-[#d4af37]" href="#pricing">
            Pricing
          </a>
        </div>
        <a
          href="#dashboard"
          className="rounded-full border border-[#d4af37]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37] transition hover:bg-[#d4af37] hover:text-[#121214]"
        >
          Open App
        </a>
      </nav>
    </header>
  );
}
