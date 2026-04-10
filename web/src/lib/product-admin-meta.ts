/** Client-only: admin overrides for storefront (visibility, flash sale, SEO). */

export type ProductAdminMeta = {
  visible?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  /** Per gallery image id → alt text for SEO / a11y */
  imageAlts?: Record<string, string>;
  flashSale?: { endsAt: string; discountPct: number } | null;
};

const STORAGE_KEY = "lc_admin_product_meta_v1";

function readRaw(): Record<string, ProductAdminMeta> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return {};
    return JSON.parse(s) as Record<string, ProductAdminMeta>;
  } catch {
    return {};
  }
}

export function readAllProductMeta(): Record<string, ProductAdminMeta> {
  return readRaw();
}

export function getProductMeta(id: string): ProductAdminMeta {
  return readRaw()[id] ?? {};
}

export function setProductMeta(id: string, patch: Partial<ProductAdminMeta>): void {
  if (typeof window === "undefined") return;
  const all = readRaw();
  all[id] = { ...all[id], ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("lc-product-meta"));
}

/** Remove admin overrides when a product is deleted from the catalog. */
export function deleteProductMeta(id: string): void {
  if (typeof window === "undefined") return;
  const all = readRaw();
  if (!(id in all)) return;
  delete all[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("lc-product-meta"));
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
