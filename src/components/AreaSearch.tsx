"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export type Area = {
  id: string;
  name: string;
  country_name: string;
  administrative_division_level_1_name: string;
  administrative_division_level_2_name: string;
  administrative_division_level_3_name: string;
  administrative_division_level_4_name: string;
  postal_code: number;
};

export default function AreaSearch({
  value,
  onChange,
}: {
  value: Area | null;
  onChange: (a: Area | null) => void;
}) {
  const [q, setQ] = useState(value ? formatArea(value) : "");
  const [areas, setAreas] = useState<Area[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    if (q.trim().length < 3 || (value && q === formatArea(value))) {
      setAreas([]);
      return;
    }
    tRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/shipping/areas?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setAreas(data.areas || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (tRef.current) clearTimeout(tRef.current); };
  }, [q, value]);

  function pick(a: Area) {
    onChange(a);
    setQ(formatArea(a));
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          className="input pl-9"
          placeholder="cth: Sunter Agung, Kelapa Gading Barat..."
          value={q}
          onChange={(e) => { setQ(e.target.value); if (value) onChange(null); }}
          onFocus={() => { if (areas.length > 0) setOpen(true); }}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />}
      </div>
      {open && areas.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          {areas.map((a) => (
            <li
              key={a.id}
              onClick={() => pick(a)}
              className="cursor-pointer border-b border-neutral-100 px-3 py-2 text-sm last:border-0 hover:bg-brand-50"
            >
              <div className="font-medium">{a.administrative_division_level_4_name || a.administrative_division_level_3_name}</div>
              <div className="text-xs text-neutral-500">
                {[a.administrative_division_level_3_name, a.administrative_division_level_2_name, a.administrative_division_level_1_name].filter(Boolean).join(", ")} • {a.postal_code}
              </div>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
          ✓ Area dipilih: <b>{formatArea(value)}</b>
        </div>
      )}
    </div>
  );
}

function formatArea(a: Area) {
  return `${a.administrative_division_level_4_name || a.administrative_division_level_3_name}, ${a.administrative_division_level_2_name} (${a.postal_code})`;
}
