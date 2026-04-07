/** Demo: user address pins → admin map (localStorage). */

import type { SavedAddress } from "@/lib/saved-address";

const KEY = "lc_address_pins_admin_v1";

export type AddressPinRow = {
  id: string;
  label: string;
  line1: string;
  pin: string;
  city: string;
  lat: number;
  lng: number;
  updatedAt: string;
};

export function syncAddressPinsForAdmin(
  addresses: SavedAddress[],
  userLabel = "demo@user"
): void {
  if (typeof window === "undefined") return;
  const rows: AddressPinRow[] = addresses
    .filter(
      (a): a is SavedAddress & { lat: number; lng: number } =>
        typeof a.lat === "number" &&
        typeof a.lng === "number" &&
        Number.isFinite(a.lat) &&
        Number.isFinite(a.lng)
    )
    .map((a) => ({
      id: a.id,
      label: `${userLabel} · ${a.label}`,
      line1: a.line1,
      pin: a.pin,
      city: a.city,
      lat: a.lat,
      lng: a.lng,
      updatedAt: new Date().toISOString(),
    }));
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("lc-address-pins"));
}

export function getAddressPinsForAdmin(): AddressPinRow[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    const p = JSON.parse(s) as AddressPinRow[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
