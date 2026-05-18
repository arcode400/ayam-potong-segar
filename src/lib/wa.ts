import { STORE, rupiah } from "./config";

export function isValidPhoneID(p: string) {
  const s = p.replace(/\D/g, "");
  return /^(62|0)8\d{8,12}$/.test(s);
}

export function normalizePhoneID(p: string) {
  let s = p.replace(/\D/g, "");
  if (s.startsWith("0")) s = "62" + s.slice(1);
  if (s.startsWith("8")) s = "62" + s;
  return s;
}

export function buildOrderWAMessage(o: {
  name: string;
  phone?: string;
  address: string;
  items: { name: string; qty: number; unit: string; subtotal: number }[];
  subtotal?: number;
  shippingLabel?: string | null;
  shippingCost?: number;
  uniqueCode?: number;
  proofUrl?: string | null;
  total: number;
  notes?: string;
}) {
  const lines = [
    `*Pesanan Ayam Potong Segar ${STORE.name}*`,
    "",
    `Nama   : ${o.name}`,
    o.phone ? `WA     : ${o.phone}` : "",
    `Alamat : ${o.address}`,
    "",
    "*Pesanan:*",
    ...o.items.map((i) => `• ${i.name} — ${i.qty} ${i.unit} = ${rupiah(i.subtotal)}`),
    "",
    o.shippingLabel ? `🛵 Pengiriman: ${o.shippingLabel}` : "",
    o.subtotal != null ? `Subtotal      : ${rupiah(o.subtotal)}` : "",
    o.shippingCost ? `Ongkir        : ${rupiah(o.shippingCost)}` : "",
    o.uniqueCode != null ? `Kode unik     : ${o.uniqueCode}` : "",
    `*Total Transfer : ${rupiah(o.total)}*`,
    "",
    o.notes ? `Catatan: ${o.notes}` : "",
    o.proofUrl ? `\n📎 Bukti transfer: ${o.proofUrl}` : "",
    "",
    "⚠️ Mohon transfer PERSIS nominal di atas (termasuk kode unik) agar pesanan langsung diverifikasi.",
    "Terima kasih 🙏",
  ].filter(Boolean);
  return lines.join("\n");
}

export function waLink(msg: string) {
  return `https://wa.me/${STORE.waAdmin}?text=${encodeURIComponent(msg)}`;
}
