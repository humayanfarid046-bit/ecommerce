/**
 * Admin “category discount” (per slug %) — same key as admin-products panel.
 * Client-only; cart/checkout read this for line totals.
 */

import type { Product } from "@/lib/mock-data";

export const CATEGORY_DISCOUNT_KEY = "lc_category_discount_v1";

function readMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(CATEGORY_DISCOUNT_KEY);
    if (!s) return {};
    const p = JSON.parse(s) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(p)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0 && n <= 90) {
        out[k] = Math.round(n);
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Percent off (1–90) for a category slug, or 0 if none. */
export function getCategoryDiscountPct(categorySlug: string): number {
  return readMap()[categorySlug] ?? 0;
}

export function effectiveUnitPriceAfterCategoryDiscount(
  basePrice: number,
  categorySlug: string
): number {
  const pct = getCategoryDiscountPct(categorySlug);
  if (pct <= 0) return basePrice;
  return Math.max(1, Math.round((basePrice * (100 - pct)) / 100));
}

export function effectiveLineTotalRupees(product: Product, qty: number): number {
  return (
    effectiveUnitPriceAfterCategoryDiscount(product.price, product.categorySlug) *
    qty
  );
}

/** Merge one slug into stored map and notify storefront. */
export function setCategoryDiscountForSlug(slug: string, pct: number): void {
  if (typeof window === "undefined") return;
  const prev = readMap();
  const clamped = Math.min(90, Math.max(0, Math.round(pct)));
  const next = { ...prev, [slug]: clamped };
  localStorage.setItem(CATEGORY_DISCOUNT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-category-discount"));
}
