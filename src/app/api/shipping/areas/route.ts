import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    if (q.trim().length < 3) return NextResponse.json({ areas: [] });

    const url = `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { Authorization: process.env.BITESHIP_API_KEY || "" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return NextResponse.json({ error: data.error || "Gagal cari alamat", detail: data }, { status: res.status });
    }
    const areas = (data.areas || []) as any[];
    const qLower = q.toLowerCase();
    // Prioritaskan: (1) match persis di nama, (2) Jakarta/Jabodetabek dulu
    const isJabodetabek = (a: any) => {
      const prov = (a.administrative_division_level_1_name || "").toLowerCase();
      const kota = (a.administrative_division_level_2_name || "").toLowerCase();
      return prov.includes("jakarta") || prov.includes("dki") || prov.includes("banten") || prov.includes("jawa barat")
        || ["bogor","depok","tangerang","bekasi"].some((k) => kota.includes(k));
    };
    const score = (a: any) => {
      const nameMatch = `${a.administrative_division_level_4_name} ${a.administrative_division_level_3_name}`.toLowerCase().includes(qLower) ? 2 : 0;
      const jboMatch = isJabodetabek(a) ? 1 : 0;
      return nameMatch + jboMatch;
    };
    areas.sort((a, b) => score(b) - score(a));
    return NextResponse.json({ areas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
