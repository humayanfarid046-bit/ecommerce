import type { MetadataRoute } from "next";
import { categories, getProducts } from "@/lib/mock-data";
import { routing } from "@/i18n/routing";

const STATIC_PATHS = [
  "/",
  "/cart",
  "/search",
  "/wishlist",
  "/compare",
  "/help",
  "/login",
  "/account",
  "/privacy",
  "/terms",
  "/shipping",
  "/cookies",
] as const;

/**
 * Normalize site origin (no trailing slash). Prefer NEXT_PUBLIC_SITE_URL in production.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/**
 * Public URL for a locale + pathname. Matches `localePrefix: "as-needed"` (default locale has no prefix).
 */
export function absoluteUrl(
  origin: string,
  locale: string,
  pathname: string
): string {
  const base = origin.replace(/\/$/, "");
  const path = pathname === "/" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return `${base}${path || "/"}`;
  }
  return `${base}/${locale}${path}`;
}

export function buildSitemapXml(origin: string): string {
  const pathnames = getAllPathnames();
  const lines: string[] = [];
  for (const loc of routing.locales) {
    for (const p of pathnames) {
      const locPath = p === "/" ? "/" : p;
      const url = absoluteUrl(origin, loc, locPath);
      lines.push(
        `  <url><loc>${escapeXml(url)}</loc><changefreq>weekly</changefreq></url>`
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join("\n")}
</urlset>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** All pathname keys for sitemap (no locale prefix). */
export function getAllPathnames(): string[] {
  const paths = new Set<string>();
  STATIC_PATHS.forEach((p) => paths.add(p));
  categories.forEach((c) => paths.add(`/category/${c.slug}`));
  getProducts().forEach((p) => paths.add(`/product/${p.id}`));
  return [...paths];
}

export function buildMetadataSitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const out: MetadataRoute.Sitemap = [];
  const lastModified = new Date();
  for (const loc of routing.locales) {
    for (const p of getAllPathnames()) {
      const locPath = p === "/" ? "/" : p;
      out.push({
        url: absoluteUrl(origin, loc, locPath),
        lastModified,
        changeFrequency: "weekly",
        priority: p === "/" ? 1 : p.startsWith("/product/") ? 0.8 : 0.6,
      });
    }
  }
  return out;
}
