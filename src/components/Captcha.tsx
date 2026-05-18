"use client";
import { useEffect, useState } from "react";

export default function Captcha({ onChange }: { onChange: (ok: boolean) => void }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [v, setV] = useState("");

  function reset() {
    setA(Math.floor(Math.random() * 9) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setV("");
  }
  useEffect(() => { reset(); }, []);
  useEffect(() => { onChange(parseInt(v || "0", 10) === a + b); }, [v, a, b, onChange]);

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-bold tracking-widest select-none">{a} + {b} =</div>
      <input
        className="input max-w-[100px]"
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
        placeholder="?"
      />
      <button type="button" onClick={reset} className="text-xs text-brand-700 underline">ganti</button>
    </div>
  );
}
