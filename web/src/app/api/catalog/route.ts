import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { Product } from "@/lib/product-model";
import { parseStoredProduct } from "@/lib/catalog-products-storage";

const DOC_PATH = "publicCatalog/manifest";

/**
 * Public product list for storefront — synced from admin (Firestore `publicCatalog/manifest`).
 * `catalogBackedBy`: `firestore` = server can read manifest; `server_unconfigured` = no Admin SDK env (shoppers never see admin-only local saves).
 * Firebase Storage is unrelated to this list (images may use Storage URLs or `/` paths).
 */
export async function GET() {
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({
      products: [] as Product[],
      catalogBackedBy: "server_unconfigured" as const,
    });
  }
  try {
    const snap = await db.doc(DOC_PATH).get();
    if (!snap.exists) {
      return NextResponse.json({
        products: [] as Product[],
        catalogBackedBy: "firestore" as const,
      });
    }
    const data = snap.data() as { products?: unknown };
    const raw = data?.products;
    if (!Array.isArray(raw)) {
      return NextResponse.json({
        products: [] as Product[],
        catalogBackedBy: "firestore" as const,
      });
    }
    const products: Product[] = [];
    for (const row of raw) {
      const p = parseStoredProduct(row);
      if (p) products.push(p);
    }
    return NextResponse.json({ products, catalogBackedBy: "firestore" as const });
  } catch {
    return NextResponse.json({
      products: [] as Product[],
      catalogBackedBy: "firestore" as const,
    });
  }
}
