/**
 * Google Maps directions for riders — optional shop/hub origin via env.
 * Set `NEXT_PUBLIC_DELIVERY_MAPS_ORIGIN` to your warehouse address (or `lat,lng`).
 */

export function buildDeliveryMapsDirectionsUrl(opts: {
  destinationAddress?: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
}): string {
  const u = new URL("https://www.google.com/maps/dir/?api=1");
  const hasPin =
    opts.destinationLat != null &&
    opts.destinationLng != null &&
    Number.isFinite(opts.destinationLat) &&
    Number.isFinite(opts.destinationLng);
  if (hasPin) {
    u.searchParams.set("destination", `${opts.destinationLat},${opts.destinationLng}`);
  } else {
    u.searchParams.set("destination", opts.destinationAddress?.trim() || "");
  }
  const rawOrigin =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_DELIVERY_MAPS_ORIGIN?.trim()
      : "";
  if (rawOrigin) u.searchParams.set("origin", rawOrigin);
  return u.toString();
}

/** Ask customer to share live location on WhatsApp (India-friendly number). */
export function buildDeliveryWhatsAppUrl(
  phoneDigits: string,
  orderId: string
): string | null {
  const d = phoneDigits.replace(/\D/g, "");
  if (d.length < 10) return null;
  const n = d.length === 10 ? `91${d}` : d;
  const text = `Hi! I'm your delivery partner for order ${orderId}. Please share your live location: tap Attach → Location → Share live location. Thank you!`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
