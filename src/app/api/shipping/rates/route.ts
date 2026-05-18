import { NextRequest, NextResponse } from "next/server";

const BITESHIP_BASE = "https://api.biteship.com/v1";

// Instant & same-day couriers (cocok untuk fresh food)
const COURIERS = [
  "gojek",
  "grab",
  "borzo",
  "lalamove",
  "paxel",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destinationAreaId, destinationPostalCode, items } = body;

    if (!destinationAreaId && !destinationPostalCode) {
      return NextResponse.json({ error: "Area tujuan wajib diisi." }, { status: 400 });
    }

    const payload: any = {
      origin_postal_code: parseInt(process.env.PICKUP_POSTAL_CODE || "14350"),
      origin_latitude: parseFloat(process.env.PICKUP_LAT || "-6.1389796"),
      origin_longitude: parseFloat(process.env.PICKUP_LNG || "106.8703051"),
      couriers: COURIERS.join(","),
      items: (items || []).map((i: any) => ({
        name: i.name,
        description: i.name,
        value: i.subtotal || i.price || 50000,
        weight: i.weight || 1500,
        quantity: i.qty || 1,
      })),
    };

    if (destinationAreaId) payload.destination_area_id = destinationAreaId;
    if (destinationPostalCode) payload.destination_postal_code = parseInt(destinationPostalCode);

    const res = await fetch(`${BITESHIP_BASE}/rates/couriers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.BITESHIP_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json({ error: data.error || "Gagal mengambil ongkir", detail: data }, { status: res.status });
    }

    // Prioritaskan instant & same_day (chicken is perishable), tapi tampilkan semua kalau gak ada
    const all = data.pricing || [];
    const fast = all.filter((p: any) => p.service_type === "instant" || p.service_type === "same_day");
    const pricing = fast.length > 0 ? fast : all;

    return NextResponse.json({ pricing, all_count: all.length, fast_count: fast.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
