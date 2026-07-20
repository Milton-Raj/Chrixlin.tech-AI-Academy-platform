"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="hero-glow flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Lock size={22} />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold">
          Chrixlin<span className="text-gold">.tech</span> Admin
        </h1>
        <p className="mt-1 text-center text-xs text-muted">Sign in to the admin portal</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@chrixlin.tech"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button className="btn-cta w-full" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null} Sign In
          </button>
        </div>
      </form>
    </main>
  );
}
