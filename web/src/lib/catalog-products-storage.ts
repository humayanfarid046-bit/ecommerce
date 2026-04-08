/** Client-only catalog: products you add in Admin (localStorage). */

import type { Product, Review } from "@/lib/product-model";
import { mergeCatalogViews } from "@/lib/catalog-cloud";

const KEY = "lc_store_catalog_v1";

/** For cross-tab sync (refetch remote when another tab updates the catalogue). */
export const CATALOG_LOCALSTORAGE_KEY = KEY;

export const CATALOG_EVENT = "lc-catalog";

/** In-memory snapshot from GET /api/catalog (Firestore). Browser-only. */
let remoteCatalogSnapshot: Product[] = [];

export function setRemoteCatalogSnapshot(next: Product[]): void {
  remoteCatalogSnapshot = next;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CATALOG_EVENT));
  }
}

/** Merged view: localStorage + server catalog (same tab / other devices). */
export function getMergedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  return mergeCatalogViews(readCatalogProducts(), remoteCatalogSnapshot);
}

async function tryPushCatalogToCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { getFirebaseAuth } = await import("@/lib/firebase/client");
    const { sanitizeProductForCloud } = await import("@/lib/catalog-cloud");
    const auth = getFirebaseAuth();
    const token = await auth?.currentUser?.getIdToken();
    if (!token) return;
    const products = readCatalogProducts().map(sanitizeProductForCloud);
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ products }),
    });
    if (res.ok) {
      const r2 = await fetch("/api/catalog", { cache: "no-store" });
      const j2 = (await r2.json()) as { products?: Product[] };
      setRemoteCatalogSnapshot(Array.isArray(j2.products) ? j2.products : []);
    }
  } catch {
    /* offline or not admin — ignore */
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseReviews(raw: unknown): Review[] {
  if (!Array.isArray(raw)) return [];
  const out: Review[] = [];
  for (const r of raw) {
    if (!isRecord(r)) continue;
    const id = typeof r.id === "string" ? r.id : "";
    const user = typeof r.user === "string" ? r.user : "Customer";
    const rating = typeof r.rating === "number" ? r.rating : 0;
    const text = typeof r.text === "string" ? r.text : "";
    const date = typeof r.date === "string" ? r.date : new Date().toISOString().slice(0, 10);
    if (!id) continue;
    out.push({
      id,
      user,
      rating,
      text,
      date,
      images: Array.isArray(r.images) ? (r.images as string[]) : undefined,
      verifiedPurchase: r.verifiedPurchase === true,
    });
  }
  return out;
}

function normalizeProduct(raw: unknown): Product | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const brand = typeof raw.brand === "string" ? raw.brand.trim() : "Store";
  const categorySlug =
    typeof raw.categorySlug === "string" ? raw.categorySlug.trim() : "mens-wear";
  const price = typeof raw.price === "number" && raw.price >= 0 ? raw.price : NaN;
  const mrp = typeof raw.mrp === "number" && raw.mrp >= 0 ? raw.mrp : NaN;
  if (!id || !title || !slug || !Number.isFinite(price)) return null;
  const mrpSafe = Number.isFinite(mrp) ? mrp : Math.round(price * 1.2);
  const discountPct =
    typeof raw.discountPct === "number" && raw.discountPct >= 0 && raw.discountPct <= 100
      ? raw.discountPct
      : mrpSafe > 0
        ? Math.max(0, Math.round(((mrpSafe - price) / mrpSafe) * 100))
        : 0;
  const rating =
    typeof raw.rating === "number" && raw.rating >= 0 && raw.rating <= 5 ? raw.rating : 0;
  const reviewCount =
    typeof raw.reviewCount === "number" && raw.reviewCount >= 0 ? raw.reviewCount : 0;
  const inStock = raw.inStock !== false;
  const images = Array.isArray(raw.images)
    ? (raw.images as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const highlights = Array.isArray(raw.highlights)
    ? (raw.highlights as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const description =
    typeof raw.description === "string" ? raw.description : "";
  const reviews = parseReviews(raw.reviews);

  const p: Product = {
    id,
    title,
    slug,
    brand,
    categorySlug,
    price,
    mrp: mrpSafe,
    discountPct,
    rating,
    reviewCount,
    inStock,
    images,
    highlights,
    description,
    reviews,
  };

  if (Array.isArray(raw.specifications)) {
    const specs: { label: string; value: string }[] = [];
    for (const row of raw.specifications) {
      if (!isRecord(row)) continue;
      const label = typeof row.label === "string" ? row.label : "";
      const value = typeof row.value === "string" ? row.value : "";
      if (label && value) specs.push({ label, value });
    }
    if (specs.length) p.specifications = specs;
  }
  if (typeof raw.stockLeft === "number") p.stockLeft = raw.stockLeft;
  if (typeof raw.activeViewers === "number") p.activeViewers = raw.activeViewers;
  if (isRecord(raw.ratingBreakdown)) p.ratingBreakdown = raw.ratingBreakdown as Product["ratingBreakdown"];
  if (raw.openBoxDelivery === true) p.openBoxDelivery = true;
  if (Array.isArray(raw.bundleIds)) {
    p.bundleIds = (raw.bundleIds as unknown[]).filter((x): x is string => typeof x === "string");
  }
  if (typeof raw.demoVideoUrl === "string" && raw.demoVideoUrl) p.demoVideoUrl = raw.demoVideoUrl;
  if (Array.isArray(raw.sizeOptions)) {
    p.sizeOptions = (raw.sizeOptions as unknown[]).filter((x): x is string => typeof x === "string");
  }
  if (Array.isArray(raw.colorOptions)) {
    const colors: { id: string; label: string; hex: string }[] = [];
    for (const c of raw.colorOptions) {
      if (!isRecord(c)) continue;
      const cid = typeof c.id === "string" ? c.id : "";
      const label = typeof c.label === "string" ? c.label : "";
      const hex = typeof c.hex === "string" ? c.hex : "#ccc";
      if (cid && label) colors.push({ id: cid, label, hex });
    }
    if (colors.length) p.colorOptions = colors;
  }
  if (typeof raw.galleryBackground === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(raw.galleryBackground.trim())) {
    p.galleryBackground = raw.galleryBackground.trim();
  }
  return p;
}

/** Validate a row from Firestore or API (public GET). */
export function parseStoredProduct(raw: unknown): Product | null {
  return normalizeProduct(raw);
}

export function readCatalogProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Product[] = [];
    for (const row of parsed) {
      const p = normalizeProduct(row);
      if (p) out.push(p);
    }
    return out;
  } catch {
    return [];
  }
}

export function writeCatalogProducts(next: Product[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CATALOG_EVENT));
  void tryPushCatalogToCloud();
}

export function upsertCatalogProduct(product: Product): void {
  const cur = readCatalogProducts();
  const i = cur.findIndex((p) => p.id === product.id);
  if (i === -1) cur.push(product);
  else cur[i] = product;
  writeCatalogProducts(cur);
}

export function deleteCatalogProduct(id: string): void {
  writeCatalogProducts(readCatalogProducts().filter((p) => p.id !== id));
}

export function newCatalogProductId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
