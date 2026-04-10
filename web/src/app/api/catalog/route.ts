import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { Product } from "@/lib/product-model";
import { parseStoredProduct } from "@/lib/catalog-products-storage";
import { verifyModuleAccess } from "@/lib/server-access";

const DOC_PATH = "publicCatalog/manifest";

/**
 * Public product list for storefront — synced from admin (Firestore `publicCatalog/manifest`).
 * Without auth: soft-deleted rows (`deletedAt`) are omitted. With Bearer + products access: full manifest.
 * `catalogBackedBy`: `firestore` = server can read manifest; `server_unconfigured` = no Admin SDK env (shoppers never see admin-only local saves).
 */
export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "products");
  const forAdmin = gate.ok;

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
    const out = forAdmin ? products : products.filter((p) => !p.deletedAt);
    return NextResponse.json({ products: out, catalogBackedBy: "firestore" as const });
  } catch {
    return NextResponse.json({
      products: [] as Product[],
      catalogBackedBy: "firestore" as const,
    });
  }
}
