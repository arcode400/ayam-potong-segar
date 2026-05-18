"use client";
import { useEffect, useState } from "react";
import { STORE } from "@/lib/config";
import { Clock } from "lucide-react";

export default function CountdownClose() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;

  const close = new Date(now);
  close.setHours(STORE.closeHour, 0, 0, 0);
  const open = new Date(now);
  open.setHours(STORE.openHour, 0, 0, 0);

  const isOpen = now >= open && now < close;
  const diff = Math.max(0, close.getTime() - now.getTime());
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);

  return (
    <div className={"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium " + (isOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
      <Clock size={14} />
      {isOpen ? (
        <>Tutup dalam {h.toString().padStart(2,"0")}:{m.toString().padStart(2,"0")}:{s.toString().padStart(2,"0")}</>
      ) : (
        <>Order untuk besok • buka {String(STORE.openHour).padStart(2,"0")}.00</>
      )}
    </div>
  );
}
