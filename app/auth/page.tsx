"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  async function handleSignIn() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121214] px-5 text-[#fdfbf7]">
        <div className="max-w-md text-center">
          <p className="text-5xl mb-6">&#9993;</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Check your inbox</h1>
          <p className="mt-4 text-[#fdfbf7]/62">
            A magic link has been sent to <span className="text-[#d4af37]">{email}</span>.
            Click the link in the email to sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121214] px-5 text-[#fdfbf7]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.34em] text-[#d4af37]">HookCraft AI</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Sign in or create account</h1>
          <p className="mt-3 text-[#fdfbf7]/52">
            Enter your email to receive a magic sign-in link. No password needed.
          </p>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          placeholder="you@example.com"
          className="w-full border border-white/10 bg-[#1a2332] px-5 py-4 text-lg text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/25 focus:border-[#d4af37]/60"
        />

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading || !email.trim()}
          className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#121214] transition hover:bg-[#f0d36b] disabled:opacity-40"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>

        <a href="/" className="mt-6 block text-center text-sm text-[#fdfbf7]/40 hover:text-[#d4af37] transition">
          Back to home
        </a>
      </div>
    </div>
  );
}
