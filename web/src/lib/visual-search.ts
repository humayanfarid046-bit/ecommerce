/**
 * Client-side “photo search”: compares dominant colour from the user image
 * to product colour swatches / category hue hints. No external ML API.
 */

import type { Product } from "@/lib/product-model";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0]! + h[0]!, 16);
    const g = parseInt(h[1]! + h[1]!, 16);
    const b = parseInt(h[2]! + h[2]!, 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return null;
  return { r, g, b };
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d < 1e-6) return 0;
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

function hashHueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 360;
  }
  return h;
}

export async function extractAverageRgb(
  file: File
): Promise<{ r: number; g: number; b: number }> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const w = 48;
  const h = 48;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { r: 128, g: 128, b: 128 };
  }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const data = ctx.getImageData(0, 0, w, h).data;
  let r = 0;
  let g = 0;
  let b = 0;
  const n = (w * h) || 1;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]!;
    g += data[i + 1]!;
    b += data[i + 2]!;
  }
  return { r: r / n, g: g / n, b: b / n };
}

function scoreProduct(p: Product, q: { r: number; g: number; b: number }): number {
  const qh = rgbToHue(q.r, q.g, q.b);
  if (p.colorOptions?.length) {
    let best = 1e9;
    for (const c of p.colorOptions) {
      const rgb = hexToRgb(c.hex);
      if (!rgb) continue;
      const d = colorDistance(q, rgb);
      if (d < best) best = d;
    }
    if (best < 1e8) return best;
  }
  const ch = hashHueFromString(p.categorySlug);
  const dh = Math.min(Math.abs(qh - ch), 360 - Math.abs(qh - ch));
  return dh * 2 + 40;
}

/**
 * Returns products sorted by visual similarity (lower score = better), best first.
 */
export function rankProductsByImageColor(
  products: Product[],
  q: { r: number; g: number; b: number }
): Product[] {
  const scored = products
    .filter((p) => p.inStock)
    .map((p) => ({ p, s: scoreProduct(p, q) }));
  scored.sort((a, b) => a.s - b.s);
  return scored.map((x) => x.p);
}
