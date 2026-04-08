import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import type { Product } from "@/lib/product-model";
import { sanitizeProductForCloud } from "@/lib/catalog-cloud";

const DOC_PATH = "publicCatalog/manifest";

/**
 * Replace public catalog manifest (metadata + non–data URLs for images).
 */
export async function POST(req: Request) {
  const gate = await verifyModuleAccess(req, "products");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rec = body as { products?: unknown };
  if (!Array.isArray(rec.products)) {
    return NextResponse.json({ error: "Expected { products: Product[] }" }, { status: 400 });
  }
  const products = (rec.products as Product[]).map(sanitizeProductForCloud);
  await db.doc(DOC_PATH).set({
    products,
    updatedAt: new Date().toISOString(),
    updatedBy: gate.uid,
  });
  return NextResponse.json({ ok: true, count: products.length });
}
