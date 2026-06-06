"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

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
    } else {
      setStep("code");
    }
    setLoading(false);
  }

  async function handleVerifyCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    if (err) {
      setError(err.message);
    } else {
      location.href = "/";
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121214] px-5 text-[#fdfbf7]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.34em] text-[#d4af37]">HookCraft AI</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Sign in or create account</h1>
          <p className="mt-3 text-[#fdfbf7]/52">
            {step === "email"
              ? "Enter your email to receive a one-time code."
              : `A 6-digit code was sent to ${email}. Enter it below.`}
          </p>
        </div>

        {step === "email" ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              placeholder="you@example.com"
              className="w-full border border-white/10 bg-[#1a2332] px-5 py-4 text-lg text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/25 focus:border-[#d4af37]/60"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading || !email.trim()}
              className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] transition hover:bg-[#f0d36b] disabled:opacity-40"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              placeholder="000000"
              className="w-full border border-white/10 bg-[#1a2332] px-5 py-4 text-center text-2xl tracking-[0.3em] text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/25 focus:border-[#d4af37]/60"
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] transition hover:bg-[#f0d36b] disabled:opacity-40"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
              className="mt-4 w-full text-sm text-[#fdfbf7]/40 hover:text-[#d4af37] transition"
            >
              Change email
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

        <a href="/" className="mt-6 block text-center text-sm text-[#fdfbf7]/40 hover:text-[#d4af37] transition">
          Back to home
        </a>
      </div>
    </div>
  );
}
