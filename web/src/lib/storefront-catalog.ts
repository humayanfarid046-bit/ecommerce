/**
 * Storefront product helpers. Data comes from `catalog-products-storage` (Admin / Firestore).
 * Re-exports types from `product-model` for convenience.
 */

import {
  getMergedProducts,
  getStorefrontProducts,
} from "@/lib/catalog-products-storage";
import type { Product } from "@/lib/product-model";

export type { Category, Product, Review } from "@/lib/product-model";
export { categories } from "@/lib/product-model";

export { getStorefrontProducts };

/** Admin catalog — merged local + remote, including soft-deleted rows (`deletedAt`). */
export function getProducts(): Product[] {
  return getMergedProducts();
}

export function getProductById(id: string): Product | undefined {
  return getStorefrontProducts().find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getStorefrontProducts().find((p) => p.slug === slug);
}

export function searchProducts(q: string): Product[] {
  const products = getStorefrontProducts();
  const s = q.trim().toLowerCase();
  if (!s) return products;
  if (s.startsWith("visual:") || s === "visual-search" || s === "visual") {
    return products.slice(0, 8);
  }
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      p.categorySlug.includes(s)
  );
}

export function getFrequentlyBoughtTogether(
  productId: string,
  limit = 3
): Product[] {
  const products = getStorefrontProducts();
  const p = getProductById(productId);
  if (!p) return [];
  if (p.bundleIds?.length) {
    const list = p.bundleIds
      .map((id) => getProductById(id))
      .filter((x): x is Product => x != null);
    if (list.length) return list.slice(0, limit);
  }
  return products
    .filter(
      (x) =>
        x.id !== productId &&
        x.categorySlug === p.categorySlug &&
        x.inStock
    )
    .slice(0, limit);
}

export function getPeopleAlsoLiked(productId: string, limit = 4): Product[] {
  const products = getStorefrontProducts();
  const p = getProductById(productId);
  if (!p) return [];
  const fbtIds = new Set(
    getFrequentlyBoughtTogether(productId, 12).map((x) => x.id)
  );
  const pool = products.filter(
    (x) => x.id !== productId && x.inStock && !fbtIds.has(x.id)
  );
  const same = pool.filter((x) => x.categorySlug === p.categorySlug);
  const other = pool.filter((x) => x.categorySlug !== p.categorySlug);
  return [...same, ...other].slice(0, limit);
}

export function filterProducts(
  list: Product[],
  opts: {
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    minRating?: number;
    discountMin?: number;
    inStockOnly?: boolean;
  }
): Product[] {
  return list.filter((p) => {
    if (opts.minPrice != null && p.price < opts.minPrice) return false;
    if (opts.maxPrice != null && p.price > opts.maxPrice) return false;
    if (opts.brands?.length && !opts.brands.includes(p.brand)) return false;
    if (opts.minRating != null && p.rating < opts.minRating) return false;
    if (opts.discountMin != null && p.discountPct < opts.discountMin)
      return false;
    if (opts.inStockOnly && !p.inStock) return false;
    return true;
  });
}

export function sortProductsByParam(
  list: Product[],
  sort: string | null | undefined
): Product[] {
  if (sort !== "price-asc" && sort !== "price-desc") return list;
  const copy = [...list];
  if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
  else copy.sort((a, b) => b.price - a.price);
  return copy;
}

export function getBrandsSorted(): string[] {
  return Array.from(new Set(getStorefrontProducts().map((p) => p.brand))).sort();
}
