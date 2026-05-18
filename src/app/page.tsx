import Link from "next/link";
import Image from "next/image";
import { STORE, PRODUCTS, rupiah } from "@/lib/config";
import CountdownClose from "@/components/CountdownClose";
import { MessageCircle, Truck, ShieldCheck, Flame, MapPin } from "lucide-react";

export default function HomePage() {
  const waUrl = `https://wa.me/${STORE.waAdmin}?text=${encodeURIComponent(
    `Halo ${STORE.name}, saya mau pesan ayam potong segar.`
  )}`;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
          <div className="animate-fade-up">
            <span className="chip"><Flame size={14}/> Stok terbatas setiap hari</span>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-neutral-900 md:text-5xl">
              Ayam Potong <span className="text-brand-600">Segar Harian</span>
            </h1>
            <p className="mt-3 text-neutral-600">
              Potong pagi, kirim di hari yang sama. Higienis, segar, dan langsung dari pemotongan keluarga {STORE.name}.
            </p>

            <div className="mt-4"><CountdownClose /></div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={waUrl} target="_blank" className="btn-primary">
                <MessageCircle size={18}/> WhatsApp Order
              </a>
              <Link href="/order" className="btn-outline">Pesan via Web</Link>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-neutral-600">
              <div className="card"><Truck className="mx-auto mb-1 text-brand-600" size={18}/>Antar Hari Sama</div>
              <div className="card"><ShieldCheck className="mx-auto mb-1 text-brand-600" size={18}/>Segar & Higienis</div>
              <div className="card"><MapPin className="mx-auto mb-1 text-brand-600" size={18}/>Pengiriman Sampai Rumah</div>
            </div>
          </div>

          <div className="relative h-72 overflow-hidden rounded-3xl md:h-96 animate-pop">
            <Image
              src="/images/ayam-utuh.png"
              alt="Ayam potong segar"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3 py-2 text-xs font-semibold text-brand-700 shadow">
              🐔 Dipotong pagi ini
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS PREVIEW */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pilihan Potongan</h2>
            <p className="text-sm text-neutral-500">Pilih sesuai kebutuhan dapur Anda.</p>
          </div>
          <Link href="/order" className="text-sm font-semibold text-brand-700 hover:underline">Lihat semua →</Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div key={p.key} className="card animate-fade-up overflow-hidden p-0">
              <div className="relative h-32 w-full bg-neutral-100">
                <Image src={p.image} alt={p.name} fill className="object-cover" />
              </div>
              <div className="p-3">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-neutral-500">{p.desc}</div>
                <div className="mt-2 text-sm font-bold text-brand-700">{rupiah(p.price)} <span className="text-xs font-normal text-neutral-500">/ {p.unit}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/order" className="btn-primary">Pesan Sekarang</Link>
        </div>
      </section>

      {/* INFO */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <div className="card bg-brand-50/60">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-bold text-brand-700">Jam Operasional</div>
              <div className="text-sm text-neutral-700">Setiap hari {String(STORE.openHour).padStart(2,"0")}.00 – {String(STORE.closeHour).padStart(2,"0")}.00 WIB</div>
            </div>
            <div>
              <div className="font-bold text-brand-700">Area Pengiriman</div>
              <div className="text-sm text-neutral-700">Jakarta Utara • Sekitar Sunter & Kelapa Gading</div>
            </div>
          </div>
        </div>

        {/* LOKASI / MAP */}
        <div className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Lokasi Toko</h2>
              <p className="text-sm text-neutral-500">Pasar Sunter Podomoro, Jakarta Utara</p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Pasar+Sunter+Podomoro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Petunjuk Arah →
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.938388821294!2d106.8703051!3d-6.1389796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f564ab49c719%3A0x4bd9efe715a24144!2sPasar%20Sunter%20Podomoro!5e0!3m2!1sen!2sid!4v1779135273238!5m2!1sen!2sid"
              width="100%"
              height="360"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Ayam Potong Segar Pak Sumarso"
            />
          </div>
        </div>
      </section>
    </>
  );
}
