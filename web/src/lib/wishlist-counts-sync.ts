/** Demo: aggregate wishlist counts for admin top-products view. */

const KEY = "lc_wishlist_counts_v1";

function read(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return {};
    return JSON.parse(s) as Record<string, number>;
  } catch {
    return {};
  }
}

function write(next: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-wishlist-counts"));
}

export function bumpWishlistProductCount(productId: string, delta: 1 | -1) {
  const all = read();
  const n = Math.max(0, (all[productId] ?? 0) + delta);
  if (n === 0) delete all[productId];
  else all[productId] = n;
  write(all);
}

export function getWishlistCounts(): Record<string, number> {
  return read();
}

export function topWishlistedProductIds(limit = 10): { id: string; count: number }[] {
  return Object.entries(read())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
