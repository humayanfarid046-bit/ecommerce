/** Client-only: reusable images cropped in admin (localStorage). */

export type SavedGalleryImage = {
  id: string;
  src: string;
  name: string;
  createdAt: string;
};

const KEY = "lc_admin_image_library_v1";
const MAX_ITEMS = 48;

export const ADMIN_IMAGE_LIBRARY_EVENT = "lc-admin-image-library";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function readImageLibrary(): SavedGalleryImage[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: SavedGalleryImage[] = [];
    for (const row of parsed) {
      if (!isRecord(row)) continue;
      const id = typeof row.id === "string" ? row.id : "";
      const src = typeof row.src === "string" ? row.src : "";
      if (!id || !src.startsWith("data:image/")) continue;
      out.push({
        id,
        src,
        name: typeof row.name === "string" ? row.name : "photo",
        createdAt:
          typeof row.createdAt === "string"
            ? row.createdAt
            : new Date().toISOString(),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function writeLibrary(items: SavedGalleryImage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new CustomEvent(ADMIN_IMAGE_LIBRARY_EVENT));
}

/** Dedupes by exact src; newest first. */
export function addImageToLibrary(src: string, name = "photo"): SavedGalleryImage {
  const id = `lib-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const item: SavedGalleryImage = {
    id,
    src,
    name,
    createdAt: new Date().toISOString(),
  };
  const cur = readImageLibrary().filter((x) => x.src !== src);
  writeLibrary([item, ...cur]);
  return item;
}

export function removeImageFromLibrary(id: string): void {
  writeLibrary(readImageLibrary().filter((x) => x.id !== id));
}
