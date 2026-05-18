import Link from "next/link";
import { STORE } from "@/lib/config";
import { Drumstick } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Drumstick size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-brand-700">Ayam Potong Segar</div>
            <div className="text-xs text-neutral-500">{STORE.name}</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/order" className="btn-primary px-4 py-2 text-sm">Pesan Sekarang</Link>
        </nav>
      </div>
    </header>
  );
}
