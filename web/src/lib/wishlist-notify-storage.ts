/** Demo: notify prefs for price drop / back in stock (localStorage). */

const KEY = "libas_wishlist_notify_v1";

export type NotifyPrefs = { priceDrop: boolean; backInStock: boolean };

export function readNotify(productId: string): NotifyPrefs {
  if (typeof window === "undefined") return { priceDrop: false, backInStock: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { priceDrop: false, backInStock: false };
    const all = JSON.parse(raw) as Record<string, NotifyPrefs>;
    return all[productId] ?? { priceDrop: false, backInStock: false };
  } catch {
    return { priceDrop: false, backInStock: false };
  }
}

export function writeNotify(productId: string, prefs: NotifyPrefs): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, NotifyPrefs>) : {};
    all[productId] = prefs;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
