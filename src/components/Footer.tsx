import { STORE } from "@/lib/config";
import { MapPin } from "lucide-react";

export default function Footer() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}`;
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-brand-50/40">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-600">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-semibold text-brand-700">Ayam Potong Segar {STORE.name}</div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-start gap-1 text-neutral-600 hover:text-brand-700 hover:underline"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-brand-600" />
              <span>{STORE.address}</span>
            </a>
          </div>
          <div>Buka {String(STORE.openHour).padStart(2,"0")}.00 – {String(STORE.closeHour).padStart(2,"0")}.00 WIB</div>
        </div>
        <div className="mt-4 text-xs text-neutral-500">© {new Date().getFullYear()} {STORE.name}. Semua hak dilindungi.</div>
      </div>
    </footer>
  );
}
