"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, KeyRound, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setMsg(null);
    if (!email.includes("@") || password.length < 6) {
      setMsg("Email & password (min 6 karakter) wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const supa = createClient();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/admin";
    } catch (e: any) {
      setMsg(e.message || "Login gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Login Admin</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Halaman ini khusus untuk admin toko. Customer langsung pesan tanpa login di <a href="/order" className="text-brand-700 underline">halaman pesan</a>.
      </p>

      <div className="mt-6 card space-y-3">
        <label className="text-sm font-medium">Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="input pl-9"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <label className="text-sm font-medium">Password</label>
        <div className="relative">
          <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="input pl-9"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => { if (e.key === "Enter") signIn(); }}
          />
        </div>

        <button onClick={signIn} disabled={busy} className="btn-primary w-full">
          <LogIn size={18}/> {busy ? "Masuk..." : "Masuk"}
        </button>

        {msg && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>}
      </div>
    </div>
  );
}
