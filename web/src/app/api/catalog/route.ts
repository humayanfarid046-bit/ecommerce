import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { Product } from "@/lib/product-model";
import { parseStoredProduct } from "@/lib/catalog-products-storage";

const DOC_PATH = "publicCatalog/manifest";

/**
 * Public product list for storefront — synced from admin (Firestore).
 * When FIREBASE is not configured, returns empty (client uses localStorage only).
 */
export async function GET() {
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ products: [] as Product[] });
  }
  try {
    const snap = await db.doc(DOC_PATH).get();
    if (!snap.exists) {
      return NextResponse.json({ products: [] as Product[] });
    }
    const data = snap.data() as { products?: unknown };
    const raw = data?.products;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ products: [] as Product[] });
    }
    const products: Product[] = [];
    for (const row of raw) {
      const p = parseStoredProduct(row);
      if (p) products.push(p);
    }
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] as Product[] });
  }
}
