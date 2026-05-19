export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Berkah Jaya",
  waAdmin: process.env.NEXT_PUBLIC_WA_ADMIN || "628123456789",
  openHour: 6,
  closeHour: 12,
  address: "Jl. Sunter Karya Utara II No.14, RT.14/RW.13, Sunter Agung, Kec. Tj. Priok, Jakarta Utara, DKI Jakarta 14350",
};

export type ProductKey = "boiler" | "kampung" | "kalasan" | "fillet" | "ceker" | "ati_ampela";

export const CUT_OPTIONS = ["Utuh", "Potong 4", "Potong 8", "Potong 12"] as const;
export type CutOption = typeof CUT_OPTIONS[number];

export const PRODUCTS: {
  key: ProductKey;
  name: string;
  unit: "ekor" | "kg" | "pasang";
  price: number;
  desc: string;
  emoji: string;
  image: string;
  hasCutOption?: boolean;
  weightInfo?: string;
  disabled?: boolean;
}[] = [
  { key: "boiler",     name: "Ayam Boiler",   unit: "ekor",   price: 45000,  desc: "Ayam broiler segar, pilih potongan sesuai selera.", emoji: "🐔", image: "/images/ayam-utuh.png",    hasCutOption: true, weightInfo: "±1,2 kg/ekor" },
  { key: "kampung",    name: "Ayam Kampung",  unit: "ekor",   price: 100000, desc: "Ayam kampung asli, gurih & sehat.",                 emoji: "🐓", image: "/images/ayam-kampung.png", hasCutOption: true, weightInfo: "±1 kg/ekor" },
  { key: "kalasan",    name: "Ayam Kalasan",  unit: "ekor",   price: 45000,  desc: "Ayam muda khas kalasan, daging empuk.",             emoji: "🐤", image: "/images/ayam-utuh.png",    hasCutOption: true, weightInfo: "±750 gr/ekor" },
  { key: "fillet",     name: "Fillet Dada",   unit: "kg",     price: 65000,  desc: "Daging dada tanpa tulang.",                         emoji: "🥩", image: "/images/ayam-fillet.png" },
  { key: "ati_ampela", name: "Ati Ampela",    unit: "pasang", price: 2000,   desc: "Jeroan bersih, dijual per pasang.",                 emoji: "🫀", image: "/images/ati-ampela.png" },
  { key: "ceker",      name: "Ceker",         unit: "kg",     price: 35000,  desc: "Ceker bersih segar.",                               emoji: "🦶", image: "/images/ceker.png", disabled: true },
];

export const DELIVERY_AREAS = {
  // Dalam kota = sekitar toko (Sunter & tetangga dekat), min 1 ekor
  dalam: [
    "Sunter", "Tanjung Priok", "Tj. Priok", "Tj Priok",
    "Kelapa Gading", "Pademangan", "Ancol",
    "Koja", "Cilincing", "Warakas",
    "Jakarta Utara", "Jkt Utara",
  ],
  // Dekat = masih bisa diantar tapi agak jauh, min 3 ekor
  dekat: [
    "Kemayoran", "Senen", "Cempaka Putih", "Johar Baru",
    "Pulogadung", "Cakung", "Matraman", "Jatinegara",
    "Jakarta Pusat", "Jakarta Timur", "Jkt Pusat", "Jkt Timur",
  ],
};

export const MIN_ORDER = {
  dalam: 4,
  dekat: 4,
};

export function detectArea(address: string): "dalam" | "dekat" | "luar" {
  const a = address.toLowerCase();
  if (DELIVERY_AREAS.dalam.some((x) => a.includes(x.toLowerCase()))) return "dalam";
  if (DELIVERY_AREAS.dekat.some((x) => a.includes(x.toLowerCase()))) return "dekat";
  return "luar";
}

export function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// Tarif ongkir flat per area — tinggal edit sesuai kesepakatan dengan kurir
export const SHIPPING_TARIFS: { area: string; price: number; eta: string }[] = [
  { area: "Sunter & Tanjung Priok",            price: 18000, eta: "30-60 menit" },
  { area: "Pademangan & Ancol",                price: 22000, eta: "45-75 menit" },
  { area: "Kelapa Gading",                     price: 25000, eta: "45-75 menit" },
  { area: "Koja & Cilincing",                  price: 28000, eta: "1-1.5 jam" },
  { area: "Jakarta Pusat (Kemayoran/Senen)",   price: 32000, eta: "1-1.5 jam" },
  { area: "Jakarta Timur (Pulogadung/Cakung)", price: 35000, eta: "1.5-2 jam" },
  { area: "Jakarta Utara lainnya",             price: 30000, eta: "1-2 jam" },
];
