import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-5 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#252536]/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      <div className="relative text-center animate-fade-up">
        <div className="inline-flex mb-6 relative">
          <div className="absolute inset-0 bg-[#d4af37] blur-md opacity-30 rounded-lg" />
          <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8b6914] flex items-center justify-center text-[#0a0a0f] font-black text-xl shadow-[0_0_25px_rgba(212,175,55,0.4)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <h1 className="font-display text-6xl font-black text-white mb-4">404</h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-sm mx-auto">
          Page not found. The hook you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="gold-shimmer inline-flex text-[#0a0a0f] font-bold px-8 py-4 rounded-full text-sm uppercase tracking-wider"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
