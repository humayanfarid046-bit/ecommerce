/** Demo: grace period end timestamp for order edit (localStorage). */

export function getOrCreateGraceEnd(orderId: string, minutes: number): number {
  if (typeof window === "undefined") return Date.now() + minutes * 60 * 1000;
  try {
    const k = `libas_order_grace_${orderId}`;
    const existing = localStorage.getItem(k);
    if (existing) {
      const n = Number(existing);
      if (!Number.isNaN(n)) return n;
    }
    const end = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(k, String(end));
    return end;
  } catch {
    return Date.now() + minutes * 60 * 1000;
  }
}
