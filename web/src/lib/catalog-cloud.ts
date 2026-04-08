import type { Product } from "@/lib/product-model";

const PLACEHOLDER = "/vercel.svg";

/** Strip huge data URLs before sending to Firestore (1MB doc limit). */
export function sanitizeProductForCloud(p: Product): Product {
  const images = (p.images ?? []).filter(
    (u) =>
      typeof u === "string" &&
      !u.startsWith("data:") &&
      (u.startsWith("http://") ||
        u.startsWith("https://") ||
        u.startsWith("/"))
  );
  return {
    ...p,
    images: images.length ? images : [PLACEHOLDER],
    reviews: [],
    description:
      typeof p.description === "string" && p.description.length > 12000
        ? p.description.slice(0, 12000)
        : p.description,
  };
}

/** Merge server catalog with localStorage (local wins for data: images). */
export function mergeCatalogViews(local: Product[], remote: Product[]): Product[] {
  const map = new Map<string, Product>();
  for (const p of remote) map.set(p.id, p);
  for (const p of local) {
    const r = map.get(p.id);
    if (!r) {
      map.set(p.id, p);
      continue;
    }
    const li = p.images ?? [];
    const ri = r.images ?? [];
    const useLocalData = li.some((u) => u.startsWith("data:"));
    const images = useLocalData ? li : li.length > 0 ? li : ri;
    map.set(p.id, {
      ...r,
      ...p,
      images: images.length ? images : [PLACEHOLDER],
    });
  }
  return [...map.values()];
}
