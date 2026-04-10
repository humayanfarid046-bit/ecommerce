import type { Firestore } from "firebase-admin/firestore";
import { parseStoredProduct } from "@/lib/catalog-products-storage";

/** Product id → title from `publicCatalog/manifest` (same source as GET /api/catalog). */
export async function getProductIdToTitleMap(db: Firestore): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const snap = await db.doc("publicCatalog/manifest").get();
    if (!snap.exists) return map;
    const products = (snap.data() as { products?: unknown })?.products;
    if (!Array.isArray(products)) return map;
    for (const row of products) {
      const p = parseStoredProduct(row);
      if (p?.id) map.set(p.id, p.title);
    }
  } catch {
    /* ignore */
  }
  return map;
}
