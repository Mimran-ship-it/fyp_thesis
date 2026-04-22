"use client";

import { useMemo, useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0 && !loading,
    [username, password, loading]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Invalid credentials.");
        return;
      }
      // Force a full navigation so middleware/session cookie is applied immediately.
      window.location.href = "/admin/dashboard";
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-0rem)] bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(900px_circle_at_15%_20%,rgba(37,99,235,0.35),transparent_55%),radial-gradient(700px_circle_at_80%_55%,rgba(14,165,233,0.25),transparent_60%)]" />

        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="text-white">
              <div className="text-xs font-sans tracking-[0.18em] uppercase text-blue-200/90">
                NUST · SMME · ADMIN
              </div>
              <h1 className="mt-4 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Thesis Portal CMS
              </h1>
              <p className="mt-4 max-w-xl font-sans text-sm leading-7 text-white/85">
                Sign in to update chapters, equations, figures, tables, and the
                publication-quality PDF export.
              </p>
              <div className="mt-6 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-sans text-sm text-white/85">
                <span className="text-white/90">Default username:</span>{" "}
                <span className="font-mono">admin</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="text-xs font-sans tracking-[0.16em] uppercase text-gray-600">
                Admin login
              </div>
              <div className="mt-2 font-sans text-2xl font-semibold tracking-tight text-[#1a1a1a]">
                Welcome back
              </div>
              <p className="mt-2 text-sm font-sans leading-7 text-gray-600">
                Use your admin credentials to continue.
              </p>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="text-xs font-sans tracking-[0.16em] uppercase text-gray-600">
                    Username
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-sans text-sm text-[#1a1a1a] outline-none placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    autoComplete="username"
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="text-xs font-sans tracking-[0.16em] uppercase text-gray-600">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-sans text-sm text-[#1a1a1a] outline-none placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-[#0b0f19] px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm ring-1 ring-black/10 hover:bg-black disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <div className="mt-5 border-t border-black/10 pt-4 text-xs font-sans text-gray-600">
                Tip: Use Admin → Settings to configure PDF cover, TOC, fonts, and crest.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

