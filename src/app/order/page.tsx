"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { PRODUCTS, ProductKey, rupiah, detectArea, MIN_ORDER, STORE, SHIPPING_TARIFS, CUT_OPTIONS, CutOption } from "@/lib/config";
import { buildOrderWAMessage, isValidPhoneID, normalizePhoneID, waLink } from "@/lib/wa";
import Captcha from "@/components/Captcha";
import { createClient } from "@/lib/supabase/client";
import { Minus, Plus, MessageCircle, ShieldCheck, MapPin, Upload, AlertTriangle, Truck } from "lucide-react";

type CutQty = Record<CutOption, number>;
type Qty = Record<ProductKey, CutQty>;

const EMPTY_CUT_QTY: CutQty = { "Utuh": 0, "Potong 4": 0, "Potong 8": 0, "Potong 12": 0 };
const sumCut = (cq: CutQty) => CUT_OPTIONS.reduce((s, c) => s + (cq[c] || 0), 0);

function makeUniqueCode() {
  return Math.floor(100 + Math.random() * 900);
}

export default function OrderPage() {
  const [qty, setQty] = useState<Qty>({
    boiler: { ...EMPTY_CUT_QTY },
    kampung: { ...EMPTY_CUT_QTY },
    kalasan: { ...EMPTY_CUT_QTY },
    fillet: { ...EMPTY_CUT_QTY },
    ceker: { ...EMPTY_CUT_QTY },
    ati_ampela: { ...EMPTY_CUT_QTY },
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState("Ojek Online");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uniqueCode] = useState(() => makeUniqueCode());
  const [shippingArea, setShippingArea] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Expand into flat items list (one per cut for cut-products, one for others)
  const items = useMemo(() => {
    const out: {
      key: ProductKey; name: string; unit: "ekor" | "kg" | "pasang"; price: number;
      cutOption: CutOption | null; qty: number; subtotal: number;
    }[] = [];
    for (const p of PRODUCTS) {
      if (p.disabled) continue;
      if (p.hasCutOption) {
        for (const c of CUT_OPTIONS) {
          const q = qty[p.key][c];
          if (q > 0) out.push({ key: p.key, name: p.name, unit: p.unit, price: p.price, cutOption: c, qty: q, subtotal: q * p.price });
        }
      } else {
        const q = qty[p.key]["Utuh"];
        if (q > 0) out.push({ key: p.key, name: p.name, unit: p.unit, price: p.price, cutOption: null, qty: q, subtotal: q * p.price });
      }
    }
    return out;
  }, [qty]);

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const selectedTarif = SHIPPING_TARIFS.find((t) => t.area === shippingArea) || null;
  const shippingCost = selectedTarif?.price ?? 0;
  const total = subtotal > 0 ? subtotal + shippingCost + uniqueCode : 0;
  const totalEkor = sumCut(qty.boiler) + sumCut(qty.kampung) + sumCut(qty.kalasan);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  const area = address.trim() ? detectArea(address) : null;
  const minOrder = area === "dekat" ? MIN_ORDER.dekat : MIN_ORDER.dalam;

  function inc(k: ProductKey, cut: CutOption, d: number) {
    setQty((q) => ({ ...q, [k]: { ...q[k], [cut]: Math.max(0, q[k][cut] + d) } }));
  }

  function validate(): string | null {
    if (!name.trim()) return "Nama wajib diisi.";
    if (!isValidPhoneID(phone)) return "Nomor WhatsApp tidak valid (cth: 08xxxxxxxxxx).";
    if (!address.trim()) return "Alamat wajib diisi.";
    if (area === "luar") return "Maaf, area belum terjangkau.";
    if (items.length === 0) return "Pilih minimal 1 produk.";
    const atiQty = sumCut(qty.ati_ampela);
    const nonAtiQty = items.reduce((s, i) => s + (i.key === "ati_ampela" ? 0 : i.qty), 0);
    if (atiQty > 0 && nonAtiQty === 0 && atiQty < 35) {
      return "Minimum order Ati Ampela 35 pasang jika dipesan sendiri (tanpa produk lain).";
    }
    const otherQty = sumCut(qty.fillet) + sumCut(qty.ceker) + sumCut(qty.ati_ampela);
    if (area === "dekat" && totalEkor < MIN_ORDER.dekat) return `Minimum order untuk luar area dekat adalah ${MIN_ORDER.dekat} ekor.`;
    if (area === "dalam" && totalEkor < MIN_ORDER.dalam && otherQty === 0) return `Minimum order dalam kota ${MIN_ORDER.dalam} ekor.`;
    if (delivery === "Ojek Online" && !selectedTarif) return "Pilih area pengiriman dulu.";
    if (delivery === "Diantar Toko" && totalItems < 4) return "Minimum 4 item untuk pengiriman antar toko.";
    if (!proof) return "Upload bukti transfer wajib (untuk verifikasi pembayaran).";
    if (!captchaOk) return "Captcha belum benar.";
    return null;
  }

  function preSubmit() {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setShowConfirm(true);
  }

  async function submit() {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const supa = createClient();

      let proofUrl: string | null = null;
      if (proof) {
        const path = `public/${Date.now()}-${normalizePhoneID(phone)}-${proof.name}`;
        const up = await supa.storage.from("payment-proofs").upload(path, proof, { upsert: false });
        if (!up.error) proofUrl = up.data.path;
      }

      const payload = {
        user_id: null,
        customer_name: name,
        phone: normalizePhoneID(phone),
        address,
        area,
        delivery_method: selectedTarif ? `Ojek Online (${selectedTarif.area})` : delivery,
        shipping: selectedTarif ? {
          area_name: selectedTarif.area,
          price: selectedTarif.price,
          duration: selectedTarif.eta,
        } : null,
        shipping_cost: shippingCost,
        items: items.map((i) => ({ key: i.key, name: i.name, qty: i.qty, unit: i.unit, price: i.price, subtotal: i.subtotal, cutOption: i.cutOption })),
        total,
        unique_code: uniqueCode,
        notes,
        payment_proof_url: proofUrl,
        payment_type: "full",
        status: "menunggu_pembayaran",
      };

      await supa.from("orders").insert(payload);

      const shippingLabel = selectedTarif
        ? `Ojek Online — ${selectedTarif.area} (${selectedTarif.eta})`
        : delivery === "Diantar Toko"
          ? "Diantar Toko (gratis ongkir)"
          : "Ambil Sendiri di Toko";

      const proofPublicUrl = proofUrl
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${proofUrl}`
        : null;

      const msg = buildOrderWAMessage({
        name,
        phone: normalizePhoneID(phone),
        address,
        items: items.map((i) => ({ name: i.cutOption ? `${i.name} (${i.cutOption})` : i.name, qty: i.qty, unit: i.unit, subtotal: i.subtotal })),
        subtotal,
        shippingLabel,
        shippingCost,
        uniqueCode,
        proofUrl: proofPublicUrl,
        total,
        notes,
      });
      const url = waLink(msg);
      setDone(url);
      window.location.href = url;
    } catch (e: any) {
      setError(e.message || "Gagal mengirim pesanan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Pesan Ayam Potong</h1>
      <p className="text-sm text-neutral-500">Stok terbatas setiap hari. Pesanan diproses setelah pembayaran masuk.</p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <div className="font-semibold">Pembayaran Penuh di Muka</div>
            <div className="text-xs">
              Untuk mencegah order fiktif, pesanan hanya diproses setelah pembayaran masuk ke rekening. Setiap order dapat <b>kode unik</b> agar transfer mudah diverifikasi.
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Pilih Potongan</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRODUCTS.filter((p) => !p.disabled).map((p) => {
            const productTotal = sumCut(qty[p.key]);
            return (
              <div key={p.key} className="card">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <Image src={p.image} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-neutral-500">{rupiah(p.price)} / {p.unit}{p.weightInfo ? ` • ${p.weightInfo}` : ""}</div>
                  </div>
                  {!p.hasCutOption && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => inc(p.key, "Utuh", -1)} className="grid h-8 w-8 place-items-center rounded-lg border"><Minus size={14}/></button>
                      <span className="w-6 text-center font-semibold">{qty[p.key]["Utuh"]}</span>
                      <button onClick={() => inc(p.key, "Utuh", +1)} className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><Plus size={14}/></button>
                    </div>
                  )}
                  {p.hasCutOption && productTotal > 0 && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">{productTotal} ekor</span>
                  )}
                </div>

                {p.hasCutOption && (
                  <div className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3">
                    {CUT_OPTIONS.map((c) => (
                      <div key={c} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-700">{c}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => inc(p.key, c, -1)} className="grid h-7 w-7 place-items-center rounded-lg border"><Minus size={12}/></button>
                          <span className="w-5 text-center text-sm font-semibold">{qty[p.key][c]}</span>
                          <button onClick={() => inc(p.key, c, +1)} className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white"><Plus size={12}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        <h2 className="text-lg font-semibold">Data Pengiriman</h2>
        <input className="input" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Nomor WhatsApp aktif (08xxxxxxxxxx)" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <textarea className="input min-h-[88px]" placeholder="Alamat lengkap (sebut kecamatan / kota)" value={address} onChange={(e) => setAddress(e.target.value)} />
        {address && area && (
          <div className={"text-xs " + (area === "luar" ? "text-red-600" : "text-emerald-700")}>
            <MapPin className="inline" size={12}/> {area === "luar"
              ? "Maaf, area belum terjangkau."
              : `Area: ${area === "dalam" ? "dalam kota" : "luar area dekat"} • minimum ${minOrder} ekor`}
          </div>
        )}
        <select className="input" value={delivery} onChange={(e) => { setDelivery(e.target.value); setShippingArea(""); }}>
          <option>Ojek Online</option>
          <option>Diantar Toko</option>
          <option>Ambil Sendiri</option>
        </select>

        {delivery === "Diantar Toko" && (
          <div className="card bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Truck size={16}/> Diantar Langsung oleh Toko
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              <b>Gratis ongkir</b> diantar langsung oleh kurir toko Pak Sumarso. Minimum pembelian <b>4 item</b>.
            </p>
            {totalItems > 0 && totalItems < 4 && (
              <div className="mt-2 text-xs text-red-600">
                ⚠️ Pembelian sekarang baru {totalItems} item — minimum 4 item untuk antar toko.
              </div>
            )}
          </div>
        )}

        {delivery === "Ojek Online" && (
          <div className="card bg-neutral-50">
            <div className="flex items-center gap-2 text-sm font-semibold"><Truck size={16} className="text-brand-600"/> Pilih Area Pengiriman</div>
            <p className="mt-1 text-xs text-neutral-500">Ongkir flat per area. Toko akan booking GoSend/Grab setelah pembayaran masuk.</p>
            <div className="mt-3 grid gap-2">
              {SHIPPING_TARIFS.map((t) => {
                const active = shippingArea === t.area;
                return (
                  <label key={t.area} className={"flex cursor-pointer items-center justify-between rounded-xl border p-3 transition " + (active ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200" : "border-neutral-200 bg-white hover:border-brand-300")}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={active} onChange={() => setShippingArea(t.area)} className="accent-brand-600"/>
                      <div>
                        <div className="text-sm font-semibold">{t.area}</div>
                        <div className="text-xs text-neutral-500">Estimasi {t.eta}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-brand-700">{rupiah(t.price)}</div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <textarea className="input" placeholder="Catatan (opsional): patokan rumah, potong lebih kecil, tanpa kulit, dll." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>

      <section className="mt-6 grid gap-3">
        <h2 className="text-lg font-semibold">Pembayaran</h2>
        <div className="card text-sm">
          <div>Transfer ke <b>BCA 5000345808</b> a.n. <b>{STORE.name}</b></div>
          {subtotal > 0 && (
            <div className="mt-3 rounded-xl bg-brand-50 p-3">
              <div className="text-xs text-neutral-600">Jumlah yang harus ditransfer (TEPAT):</div>
              <div className="text-2xl font-extrabold text-brand-700">{rupiah(total)}</div>
              <div className="mt-1 text-xs text-neutral-600">
                Termasuk <b>kode unik {uniqueCode}</b> — wajib ditransfer pas, jangan dibulatkan. Ini cara kami verifikasi pembayaran Anda.
              </div>
            </div>
          )}
        </div>
        <label className="card flex items-center gap-3 cursor-pointer">
          <Upload size={18} className="text-brand-600"/>
          <span className="text-sm">{proof ? proof.name : "Upload bukti transfer (jpg/png) — WAJIB"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
        </label>
        <Captcha onChange={setCaptchaOk} />
      </section>

      <section className="mt-6 card">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-brand-600"/> Ringkasan Pesanan</div>
        {items.length === 0 ? (
          <div className="text-sm text-neutral-500">Belum ada item.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{i.name}{i.cutOption ? ` (${i.cutOption})` : ""} × {i.qty} {i.unit}</span>
                <span className="font-medium">{rupiah(i.subtotal)}</span>
              </li>
            ))}
          </ul>
        )}
        {subtotal > 0 && (
          <>
            <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
              <span>Subtotal</span><span>{rupiah(subtotal)}</span>
            </div>
            {selectedTarif && (
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>Ongkir ({selectedTarif.area})</span>
                <span>{rupiah(shippingCost)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>Kode unik</span><span>+ {uniqueCode}</span>
            </div>
          </>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3 font-bold">
          <span>Total Transfer</span><span className="text-brand-700">{rupiah(total)}</span>
        </div>
      </section>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <button onClick={preSubmit} disabled={submitting} className="btn-primary mt-6 w-full">
        <MessageCircle size={18}/> {submitting ? "Memproses..." : "Checkout & Kirim ke WhatsApp"}
      </button>

      {done && (
        <p className="mt-3 text-center text-sm">Jika WhatsApp tidak terbuka otomatis, <a className="text-brand-700 underline" href={done}>klik di sini</a>.</p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <AlertTriangle size={20}/>
              <h3 className="text-lg font-bold">Konfirmasi Nomor WhatsApp</h3>
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              Pastikan nomor di bawah ini <b>BENAR & AKTIF</b>. Pak Sumarso akan menghubungi nomor ini untuk konfirmasi pesanan.
            </p>

            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-center">
              <div className="text-xs text-neutral-500">Nomor WhatsApp Anda:</div>
              <div className="mt-1 text-2xl font-extrabold tracking-wider text-brand-700">
                +{normalizePhoneID(phone)}
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              ⚠️ Kalau nomor salah, pesanan tidak akan bisa diproses. Pastikan kamu bisa terima WA di nomor ini sekarang.
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="btn-outline flex-1">
                Perbaiki Nomor
              </button>
              <button onClick={submit} className="btn-primary flex-1">
                Ya, Benar — Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
