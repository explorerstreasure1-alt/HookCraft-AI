"use client";

import { useSupabaseClient } from "@/lib/supabase/client";
import { useState, useRef, useEffect } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"start" | "code">("start");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = useSupabaseClient();
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "code") {
      codeInputs.current[0]?.focus();
    }
  }, [step]);

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (err) setError(err.message);
    setLoading(false);
  }

  async function handleSendCode() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
      setTimeout(() => setStep("code"), 800);
    }
  }

  function handleCodeInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newCode = code.split("");
    newCode[index] = digit;
    setCode(newCode.join(""));

    if (digit && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }

    if (newCode.filter(Boolean).length === 6) {
      setTimeout(() => verifyCode(newCode.join("")), 200);
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setCode(pasted);
    pasted.split("").forEach((d, i) => {
      if (codeInputs.current[i]) {
        codeInputs.current[i]!.value = d;
      }
    });
    if (pasted.length === 6) {
      setTimeout(() => verifyCode(pasted), 200);
    } else if (pasted.length < 6) {
      codeInputs.current[pasted.length]?.focus();
    }
  }

  async function verifyCode(codeStr: string) {
    if (codeStr.length !== 6) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codeStr,
      type: "email",
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      location.href = "/#dashboard";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-5 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#d4af37]/4 rounded-full blur-[160px] animate-pulse" style={{ animationDuration: "10s" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#252536]/30 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(212,175,55,0.03),transparent_70%)]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(201,162,39,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex mb-5 relative">
            <div className="absolute inset-0 bg-[#d4af37] blur-xl opacity-40 rounded-2xl animate-pulse" style={{ animationDuration: "4s" }} />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#c49b29] to-[#8b6914] flex items-center justify-center text-[#0a0a0f] font-black text-xl shadow-[0_0_40px_rgba(212,175,55,0.35)]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>
          <h1 className="font-display text-3xl font-black tracking-[-0.03em] text-white mb-2">
            {step === "code" ? "Check your inbox" : "Welcome to HookCraft"}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
            {step === "code"
              ? "We sent a 6‑digit code to your email. Enter it below."
              : "Sign in to save your hooks and access them anywhere."}
          </p>
        </div>

        {/* Code input step */}
        {step === "code" ? (
          <div className="space-y-6">
            {emailSent && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-center animate-fade-in">
                <p className="text-xs text-green-400/80 flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Code sent to <span className="font-semibold text-green-300">{email}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex items-center justify-center gap-3" onPaste={handleCodePaste}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeInputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] || ""}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className={`w-12 h-14 rounded-xl border text-center text-xl font-bold font-mono text-white outline-none transition-all duration-200 ${
                      code[i]
                        ? "border-[#d4af37] bg-[#d4af37]/8 shadow-[0_0_16px_rgba(212,175,55,0.15)]"
                        : "border-zinc-800 bg-[#111118] hover:border-zinc-600 focus:border-[#d4af37]/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => verifyCode(code)}
              disabled={loading || code.length !== 6}
              className="gold-shimmer w-full px-6 py-4 text-sm font-bold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify & Sign In"
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep("start"); setCode(""); setError(""); setEmailSent(false); }}
                className="text-xs text-zinc-600 hover:text-[#d4af37] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="text-xs text-zinc-600 hover:text-[#d4af37] transition-colors"
              >
                Resend code
              </button>
            </div>
          </div>
        ) : (
          /* Email + Google start step */
          <div className="space-y-4">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-[#111118] px-6 py-4 text-sm font-semibold text-white hover:border-zinc-600 hover:bg-[#18181f] active:scale-[0.99] transition-all duration-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-zinc-800" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">or use email</span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500 ml-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                placeholder="you@example.com"
                autoFocus
                className="w-full border border-zinc-800 bg-[#111118] px-5 py-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-[#d4af37]/60 rounded-xl transition-all duration-200"
              />
              <button
                onClick={handleSendCode}
                disabled={loading || !email.trim()}
                className="gold-shimmer w-full px-6 py-4 text-sm font-bold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Magic Link"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 animate-fade-in">
            <p className="text-xs text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <a href="/" className="text-xs text-zinc-600 hover:text-[#d4af37] transition-colors">
            Back to home
          </a>
          <span className="text-zinc-800">|</span>
          <a href="/#dashboard" className="text-xs text-zinc-600 hover:text-[#d4af37] transition-colors">
            Continue as guest
          </a>
        </div>
      </div>
    </div>
  );
}
