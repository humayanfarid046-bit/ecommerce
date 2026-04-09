import { getProductById, type Product } from "@/lib/storefront-catalog";
import { getStorefrontProducts } from "@/lib/catalog-products-storage";

export function getRecommendationsForWishlist(
  wishlistIds: string[],
  limit = 5
): Product[] {
  if (!wishlistIds.length) return [];
  const cats = new Set<string>();
  for (const id of wishlistIds) {
    const p = getProductById(id);
    if (p) cats.add(p.categorySlug);
  }
  const exclude = new Set(wishlistIds);
  return getStorefrontProducts()
    .filter(
      (p) =>
        !exclude.has(p.id) && cats.has(p.categorySlug) && p.inStock
    )
    .slice(0, limit);
}
