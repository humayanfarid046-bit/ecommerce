/** Local price when item was wishlisted — for “price dropped” demo (replace with API). */

const KEY = "libas_wishlist_price_v1";

export function readSnapshots(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, number>;
    return typeof p === "object" && p ? p : {};
  } catch {
    return {};
  }
}

export function setSnapshot(productId: string, price: number): void {
  if (typeof window === "undefined") return;
  const s = readSnapshots();
  s[productId] = price;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function removeSnapshot(productId: string): void {
  if (typeof window === "undefined") return;
  const s = readSnapshots();
  delete s[productId];
  localStorage.setItem(KEY, JSON.stringify(s));
}

/** Positive rupees if current price is lower than snapshot. */
export function priceDropAmount(
  productId: string,
  currentPrice: number
): number | null {
  const old = readSnapshots()[productId];
  if (old == null || currentPrice >= old) return null;
  return old - currentPrice;
}
