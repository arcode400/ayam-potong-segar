"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidPhoneID, normalizePhoneID } from "@/lib/wa";
import { MessageCircle, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    setMsg(null);
    if (!isValidPhoneID(phone)) { setMsg("Nomor WhatsApp tidak valid."); return; }
    setBusy(true);
    try {
      const supa = createClient();
      const { error } = await supa.auth.signInWithOtp({ phone: "+" + normalizePhoneID(phone) });
      if (error) throw error;
      setStep("otp");
      setMsg("Kode OTP dikirim via WhatsApp/SMS.");
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setMsg(null);
    try {
      const supa = createClient();
      const { error } = await supa.auth.verifyOtp({ phone: "+" + normalizePhoneID(phone), token: otp, type: "sms" });
      if (error) throw error;
      window.location.href = "/order";
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Masuk dengan WhatsApp</h1>
      <p className="mt-1 text-sm text-neutral-500">Verifikasi nomor untuk mencegah order fiktif.</p>

      <div className="mt-6 card space-y-3">
        {step === "phone" ? (
          <>
            <label className="text-sm font-medium">Nomor WhatsApp</label>
            <input className="input" inputMode="numeric" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button onClick={sendOtp} disabled={busy} className="btn-primary w-full">
              <MessageCircle size={18}/> Kirim OTP
            </button>
          </>
        ) : (
          <>
            <label className="text-sm font-medium">Kode OTP</label>
            <input className="input tracking-[0.5em] text-center" inputMode="numeric" placeholder="••••••" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
            <button onClick={verify} disabled={busy} className="btn-primary w-full">
              <KeyRound size={18}/> Verifikasi
            </button>
            <button onClick={() => setStep("phone")} className="w-full text-xs text-neutral-500 underline">Ganti nomor</button>
          </>
        )}
        {msg && <div className="text-sm text-brand-700">{msg}</div>}
      </div>
    </div>
  );
}
