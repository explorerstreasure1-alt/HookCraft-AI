"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"start" | "code">("start");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  async function handleGoogle() {
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (err) setError(err.message);
    setLoading(false);
  }

  async function handleSendCode() {
    if (!email.trim()) return;
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (err) setError(err.message); else setStep("code");
    setLoading(false);
  }

  async function handleVerifyCode() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (err) setError(err.message); else location.href = "/#dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-5 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#252536]/30 rounded-full blur-[100px]" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex mb-4 relative">
            <div className="absolute inset-0 bg-[#d4af37] blur-md opacity-30 rounded-lg" />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8b6914] flex items-center justify-center text-[#0a0a0f] font-black text-lg shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" fill="currentColor"/></svg>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-[-0.03em] text-white">
            {step === "code" ? "Check your email" : "Welcome"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {step === "code" ? `Enter code sent to ${email}` : "Sign in or create an account instantly"}
          </p>
        </div>

        {step === "code" ? (
          <div className="space-y-5">
            <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={e => e.key === "Enter" && handleVerifyCode()} placeholder="000000" autoFocus
              className="w-full border border-zinc-800 bg-[#111118] px-5 py-5 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-[#d4af37]/60 rounded-xl placeholder:text-zinc-700" />
            <button onClick={handleVerifyCode} disabled={loading || code.length !== 6}
              className="w-full rounded-full gold-shimmer text-[#0a0a0f] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-40">Sign In</button>
            <button onClick={() => { setStep("start"); setCode(""); setError(""); }}
              className="w-full text-xs text-zinc-600 hover:text-[#d4af37] transition">Back</button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-full border border-zinc-800 bg-[#111118] px-6 py-4 text-sm font-semibold text-white hover:border-[#d4af37]/50 hover:bg-[#1a1a24] transition-all">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-zinc-800" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendCode()} placeholder="you@example.com"
              className="w-full border border-zinc-800 bg-[#111118] px-5 py-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-[#d4af37]/60 rounded-xl" />
            <button onClick={handleSendCode} disabled={loading || !email.trim()}
              className="w-full rounded-full gold-shimmer text-[#0a0a0f] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-40">Send Code</button>
          </div>
        )}
        {error && <p className="mt-5 text-sm text-red-400 text-center">{error}</p>}
        <a href="/" className="mt-6 block text-center text-xs text-zinc-600 hover:text-[#d4af37] transition">Back to home</a>
      </div>
    </div>
  );
}
