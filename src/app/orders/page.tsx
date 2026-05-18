"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { rupiah } from "@/lib/config";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  menunggu_pembayaran: { label: "Menunggu Pembayaran", color: "bg-amber-100 text-amber-700" },
  diproses: { label: "Diproses", color: "bg-blue-100 text-blue-700" },
  dikirim: { label: "Dikirim", color: "bg-indigo-100 text-indigo-700" },
  selesai: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
  ditolak: { label: "Ditolak", color: "bg-red-100 text-red-700" },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    (async () => {
      const supa = createClient();
      const { data: u } = await supa.auth.getUser();
      if (!u.user) { setNeedLogin(true); return; }
      const { data } = await supa.from("orders").select("*").order("created_at", { ascending: false });
      setOrders(data ?? []);
    })();
  }, []);

  if (needLogin) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-xl font-bold">Belum login</h1>
        <p className="mt-2 text-sm text-neutral-500">Masuk dengan WhatsApp untuk melihat pesanan Anda.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">Masuk</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Pesanan Saya</h1>
      {!orders ? (
        <div className="mt-6 text-sm text-neutral-500">Memuat...</div>
      ) : orders.length === 0 ? (
        <div className="mt-6 card text-sm text-neutral-500">Belum ada pesanan. <Link href="/order" className="text-brand-700 underline">Pesan sekarang</Link></div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((o) => {
            const s = STATUS_LABEL[o.status] ?? { label: o.status, color: "bg-neutral-100" };
            return (
              <div key={o.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-500">#{o.id.slice(0, 8)} • {new Date(o.created_at).toLocaleString("id-ID")}</div>
                  <span className={"badge " + s.color}>{s.label}</span>
                </div>
                <ul className="mt-2 text-sm">
                  {o.items.map((i: any, idx: number) => (
                    <li key={idx} className="flex justify-between"><span>{i.name} × {i.qty} {i.unit}</span><span>{rupiah(i.subtotal)}</span></li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t pt-2 text-sm font-bold">
                  <span>Total</span><span className="text-brand-700">{rupiah(o.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
