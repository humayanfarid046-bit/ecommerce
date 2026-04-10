import { NextRequest, NextResponse } from "next/server";

/** Server-side reverse geocode (avoids browser CORS). Uses OpenStreetMap Nominatim — respect usage policy in production. */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LibasStore/1.0 (contact via site operator)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const addr = data.address;
    const city =
      addr?.city ||
      addr?.town ||
      addr?.village ||
      addr?.state_district ||
      "";
    const postcode = addr?.postcode ?? "";
    const line1 =
      [addr?.road, addr?.suburb].filter(Boolean).join(", ") ||
      data.display_name?.slice(0, 80) ||
      "";

    return NextResponse.json({
      displayName: data.display_name ?? "",
      line1: line1 || `Near ${lat}, ${lon}`,
      city: city || "—",
      pin: postcode && /^\d{6}$/.test(postcode) ? postcode : "",
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
