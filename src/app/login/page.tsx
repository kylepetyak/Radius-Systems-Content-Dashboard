"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"password" | "magic_link">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly messages for common Supabase auth errors
      if (error.message.includes("Email not confirmed")) {
        setError(
          "Your email is not confirmed yet. Please check your inbox for a confirmation link, or ask your admin to confirm your account."
        );
      } else if (error.message.includes("Invalid login credentials")) {
        setError(
          "Invalid email or password. If you were invited, check your email for the invite link to set your password."
        );
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#020617" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              }}
            >
              <span className="text-white text-lg font-black">R</span>
            </div>
            <div className="text-left">
              <p className="text-white text-lg font-semibold">Content Studio</p>
              <p className="text-slate-500 text-xs">by Radius Systems</p>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">
            Sign in to access your content plan
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "#0f172a",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          {magicLinkSent ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">
                Check your email
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                We sent a magic link to <strong className="text-white">{email}</strong>
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "#020617" }}>
                <button
                  onClick={() => setMode("password")}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: mode === "password" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: mode === "password" ? "#a5b4fc" : "#64748b",
                  }}
                >
                  Password
                </button>
                <button
                  onClick={() => setMode("magic_link")}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: mode === "magic_link" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: mode === "magic_link" ? "#a5b4fc" : "#64748b",
                  }}
                >
                  Magic Link
                </button>
              </div>

              <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-colors"
                      style={{
                        background: "#020617",
                        border: "1px solid #1e293b",
                      }}
                      placeholder="you@example.com"
                    />
                  </div>

                  {mode === "password" && (
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-colors"
                        style={{
                          background: "#020617",
                          border: "1px solid #1e293b",
                        }}
                        placeholder="Enter your password"
                      />
                    </div>
                  )}

                  {error && (
                    <div
                      className="px-4 py-3 rounded-xl text-sm font-medium leading-relaxed"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#fca5a5",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    }}
                  >
                    {loading
                      ? "..."
                      : mode === "password"
                      ? "Sign In"
                      : "Send Magic Link"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by Radius Systems
        </p>
      </div>
    </div>
  );
}
