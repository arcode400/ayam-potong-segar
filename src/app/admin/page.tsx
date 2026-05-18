"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rupiah } from "@/lib/config";
import { Printer, Check, X, RefreshCcw, Package, TrendingUp, AlertTriangle, ShieldAlert, Ban, ExternalLink } from "lucide-react";

const STATUSES = ["menunggu_pembayaran", "diproses", "dikirim", "selesai", "ditolak"] as const;

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [stock, setStock] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [verifyOrder, setVerifyOrder] = useState<any | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function load() {
    setLoading(true);
    const supa = createClient();
    const { data: ord } = await supa.from("orders").select("*").order("created_at", { ascending: false });
    const { data: st } = await supa.from("daily_stock").select("*").eq("date", today).maybeSingle();
    const { data: bl } = await supa.from("blacklist").select("*").order("created_at", { ascending: false });
    setOrders(ord ?? []);
    setStock(st?.stock_ekor ?? 0);
    setBlacklist(bl ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const supa = createClient();
    await supa.from("orders").update({ status }).eq("id", id);
    load();
  }

  async function saveStock(n: number) {
    const supa = createClient();
    await supa.from("daily_stock").upsert({ date: today, stock_ekor: n });
    setStock(n);
  }

  async function rejectAsFake(o: any) {
    if (!confirm(`Tolak order dan BLACKLIST nomor ${o.phone}?\n\nNomor ini tidak akan bisa order lagi.`)) return;
    const supa = createClient();
    await supa.from("orders").update({ status: "ditolak", notes: (o.notes || "") + " [BUKTI PALSU]" }).eq("id", o.id);
    await supa.from("blacklist").upsert({ phone: o.phone, reason: "Bukti transfer palsu/editan", order_id: o.id });
    load();
  }

  async function removeBlacklist(phone: string) {
    const supa = createClient();
    await supa.from("blacklist").delete().eq("phone", phone);
    load();
  }

  const filtered = orders.filter((o) => filter === "all" || o.status === filter);
  const todayOrders = orders.filter((o) => o.created_at.slice(0, 10) === today);
  const revenue = todayOrders.filter((o) => o.status !== "ditolak" && o.status !== "menunggu_pembayaran").reduce((s, o) => s + o.total, 0);
  const blacklistedPhones = new Set(blacklist.map((b) => b.phone));

  function printNota(o: any) {
    const w = window.open("", "_blank", "width=420,height=600");
    if (!w) return;
    w.document.write(`<pre style="font:13px monospace;padding:16px">
==== NOTA PESANAN ====
#${o.id.slice(0, 8)}
${new Date(o.created_at).toLocaleString("id-ID")}

${o.customer_name}
${o.phone}
${o.address}

${o.items.map((i: any) => `${i.name} x ${i.qty} ${i.unit} = ${rupiah(i.subtotal)}`).join("\n")}

TOTAL: ${rupiah(o.total)}
Kode Unik: ${o.unique_code || "-"}
Status: ${o.status}
Catatan: ${o.notes || "-"}
======================
</pre>`);
    w.print();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-neutral-500">Kelola pesanan & stok harian.</p>
        </div>
        <button onClick={load} className="btn-outline px-3 py-2 text-sm"><RefreshCcw size={14}/> Refresh</button>
      </div>

      {/* WARNING BANNER */}
      <div className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={24} />
          <div className="text-sm text-red-900">
            <div className="font-bold text-base">⚠️ JANGAN POTONG SEBELUM CEK mBANKING SENDIRI</div>
            <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed">
              <li><b>Screenshot bukti transfer BISA dipalsukan.</b> Selalu buka aplikasi mBanking sendiri.</li>
              <li>Cocokkan nominal masuk dengan <b>Total + Kode Unik</b> (3 digit di belakang).</li>
              <li>Belum lihat saldo masuk di mBanking = belum bayar. <b>Jangan dipotong.</b></li>
              <li>Kalau bukti terlihat janggal → klik tombol <b>"Tolak (Bukti Palsu)"</b> untuk blacklist nomornya.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card"><div className="flex items-center gap-2 text-sm text-neutral-500"><Package size={16}/> Stok Hari Ini</div>
          <div className="mt-1 flex items-center gap-2">
            <input type="number" className="input max-w-[120px]" value={stock} onChange={(e) => setStock(parseInt(e.target.value || "0"))} />
            <button onClick={() => saveStock(stock)} className="btn-primary px-3 py-2 text-sm">Simpan</button>
            <span className="text-xs text-neutral-500">ekor</span>
          </div>
        </div>
        <div className="card"><div className="text-sm text-neutral-500">Pesanan Hari Ini</div><div className="mt-1 text-2xl font-bold text-brand-700">{todayOrders.length}</div></div>
        <div className="card"><div className="flex items-center gap-2 text-sm text-neutral-500"><TrendingUp size={16}/> Omzet Hari Ini</div><div className="mt-1 text-2xl font-bold text-brand-700">{rupiah(revenue)}</div></div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={"rounded-full px-3 py-1 text-xs " + (filter === s ? "bg-brand-600 text-white" : "bg-neutral-100")}>{s}</button>
        ))}
      </div>

      {/* Orders */}
      <div className="mt-4 space-y-3">
        {loading ? "Memuat..." : filtered.length === 0 ? <div className="card text-sm text-neutral-500">Tidak ada pesanan.</div> :
          filtered.map((o) => {
            const isBlacklisted = blacklistedPhones.has(o.phone);
            return (
              <div key={o.id} className={"card " + (isBlacklisted ? "border-red-300 bg-red-50/40" : "")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {o.customer_name}
                      <span className="text-xs text-neutral-500">#{o.id.slice(0, 8)}</span>
                      {isBlacklisted && <span className="badge bg-red-200 text-red-800"><Ban size={10}/> BLACKLIST</span>}
                    </div>
                    <div className="text-xs text-neutral-500">{o.phone} • {o.address}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-neutral-100">{o.status}</span>
                    <span className="font-bold text-brand-700">{rupiah(o.total)}</span>
                  </div>
                </div>
                <ul className="mt-2 text-sm">
                  {o.items.map((i: any, idx: number) => <li key={idx}>• {i.name} × {i.qty} {i.unit}</li>)}
                </ul>
                {o.unique_code && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    💰 Nominal yang harus masuk: <b>{rupiah(o.total)}</b> (kode unik <b>{o.unique_code}</b>)
                  </div>
                )}
                {o.shipping && (
                  <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
                    🛵 <b>{o.shipping.courier_name?.toUpperCase()} {o.shipping.service_name}</b> ke kode pos <b>{o.shipping.postal_code}</b> • Ongkir {rupiah(o.shipping_cost || 0)} • {o.shipping.duration || "-"}
                  </div>
                )}
                {o.notes && <div className="mt-1 text-xs text-neutral-500">Catatan: {o.notes}</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.status === "menunggu_pembayaran" && (
                    <>
                      <button onClick={() => setVerifyOrder(o)} className="btn-primary px-3 py-1 text-xs"><Check size={14}/> Verifikasi & Approve</button>
                      <button onClick={() => rejectAsFake(o)} className="px-3 py-1 text-xs rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 inline-flex items-center gap-1">
                        <Ban size={14}/> Tolak (Bukti Palsu)
                      </button>
                      <button onClick={() => setStatus(o.id, "ditolak")} className="btn-outline px-3 py-1 text-xs"><X size={14}/> Reject biasa</button>
                    </>
                  )}
                  {o.status === "diproses" && <button onClick={() => setStatus(o.id, "dikirim")} className="btn-primary px-3 py-1 text-xs">Tandai Dikirim</button>}
                  {o.status === "dikirim" && <button onClick={() => setStatus(o.id, "selesai")} className="btn-primary px-3 py-1 text-xs">Selesai</button>}
                  {o.payment_proof_url && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${o.payment_proof_url}`}
                      target="_blank"
                      className="btn-outline px-3 py-1 text-xs"
                    ><ExternalLink size={14}/> Lihat Bukti</a>
                  )}
                  <button onClick={() => printNota(o)} className="btn-outline px-3 py-1 text-xs"><Printer size={14}/> Nota</button>
                </div>
              </div>
            );
          })
        }
      </div>

      {/* Blacklist section */}
      {blacklist.length > 0 && (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-red-700"><Ban size={18}/> Daftar Blacklist</h2>
          <p className="text-xs text-neutral-500">Nomor yang sudah pernah kirim bukti palsu / order fiktif.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {blacklist.map((b) => (
              <div key={b.phone} className="card flex items-center justify-between border-red-200 bg-red-50/40">
                <div>
                  <div className="font-semibold text-red-800">{b.phone}</div>
                  <div className="text-xs text-neutral-600">{b.reason}</div>
                  <div className="text-xs text-neutral-400">{new Date(b.created_at).toLocaleString("id-ID")}</div>
                </div>
                <button onClick={() => removeBlacklist(b.phone)} className="text-xs text-neutral-500 underline">unblacklist</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Checklist Modal */}
      {verifyOrder && (
        <VerifyModal
          order={verifyOrder}
          onCancel={() => setVerifyOrder(null)}
          onConfirm={async () => {
            await setStatus(verifyOrder.id, "diproses");
            setVerifyOrder(null);
          }}
        />
      )}
    </div>
  );
}

function VerifyModal({ order, onCancel, onConfirm }: { order: any; onCancel: () => void; onConfirm: () => void }) {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const allChecked = c1 && c2 && c3;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20}/>
          <h3 className="text-lg font-bold">Verifikasi Pembayaran</h3>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Sebelum approve, pastikan uang BENAR-BENAR sudah masuk ke rekening. Centang semua di bawah:
        </p>

        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">
          <div>Nominal yang harus masuk:</div>
          <div className="text-xl font-extrabold text-brand-700">{rupiah(order.total)}</div>
          <div className="text-xs text-neutral-600">Kode unik: <b>{order.unique_code || "-"}</b></div>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={c1} onChange={(e) => setC1(e.target.checked)} />
            <span>Saya sudah <b>buka aplikasi mBanking sendiri</b> (bukan screenshot dari customer).</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={c2} onChange={(e) => setC2(e.target.checked)} />
            <span>Saya melihat uang masuk <b>persis Rp {order.total.toLocaleString("id-ID")}</b> di mutasi rekening.</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={c3} onChange={(e) => setC3(e.target.checked)} />
            <span>Saya sudah cek nama pengirim & waktu transfer cocok dengan order ini.</span>
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="btn-outline flex-1">Batal</button>
          <button
            onClick={onConfirm}
            disabled={!allChecked}
            className={"flex-1 rounded-xl px-5 py-3 font-semibold text-white " + (allChecked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-neutral-300 cursor-not-allowed")}
          >
            <Check size={16} className="inline mr-1"/> Approve & Proses
          </button>
        </div>
      </div>
    </div>
  );
}
