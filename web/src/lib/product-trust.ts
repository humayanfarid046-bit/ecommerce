import type { Product } from "@/lib/storefront-catalog";

export type StarCounts = Record<1 | 2 | 3 | 4 | 5, number>;

export function getTrustSignals(product: Product): {
  stockLeft: number;
  viewers: number;
} {
  const n = parseInt(product.id.replace(/\D/g, ""), 10) || 7;
  return {
    stockLeft: product.stockLeft ?? (n % 6) + 1,
    viewers: product.activeViewers ?? (n % 24) + 8,
  };
}

export function getRatingBreakdown(product: Product): StarCounts {
  if (product.ratingBreakdown) {
    return { ...product.ratingBreakdown };
  }
  const total = Math.max(product.reviewCount, 1);
  const r = product.rating;
  const f5 = Math.min(0.72, 0.2 + r * 0.1);
  const f4 = 0.18;
  const f3 = 0.07;
  const f2 = 0.03;
  const f1 = Math.max(0.01, 1 - f5 - f4 - f3 - f2);
  const raw = [f1, f2, f3, f4, f5] as const;
  const s = raw.reduce((a, b) => a + b, 0);
  const nums = raw.map((x) => Math.round((x / s) * total));
  const diff = total - nums.reduce((a, b) => a + b, 0);
  nums[4] = (nums[4] ?? 0) + diff;
  return {
    1: nums[0]!,
    2: nums[1]!,
    3: nums[2]!,
    4: nums[3]!,
    5: nums[4]!,
  };
}

/** Rough delivery days from 6-digit PIN (demo heuristic). */
export function estimateDeliveryDaysFromPin(pin: string): number {
  const d = pin.replace(/\D/g, "");
  if (d.length !== 6) return 7;
  let h = 0;
  for (let i = 0; i < 6; i++) h += parseInt(d[i]!, 10);
  return 5 + (h % 4);
}

export function addCalendarDays(base: Date, days: number): Date {
  const out = new Date(base);
  out.setDate(out.getDate() + days);
  return out;
}
