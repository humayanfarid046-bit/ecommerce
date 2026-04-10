/** Client-only SEO, redirects, analytics demo (replace with API). */

import { categories, getStorefrontProducts } from "@/lib/storefront-catalog";
import { setProductMeta } from "@/lib/product-admin-meta";
import { buildSitemapXml } from "./sitemap-build";

const KEY = "lc_seo_analytics_v1";

export type CategorySeoEntry = { title: string; desc: string };

export type RedirectRule = {
  id: string;
  fromPath: string;
  /** Path without locale, e.g. /product/p1 */
  toPath: string;
};

export type AbandonedCartRow = {
  id: string;
  email: string;
  items: string;
  amount: number;
  coupon: string;
};

export type SearchKeywordRow = { query: string; count: number };

export type HeatmapRow = { section: string; clicksPct: number };

export type JourneyEdge = { from: string; to: string; count: number };

export type ExitPageRow = { url: string; exits: number };

export type SeoAnalyticsState = {
  categorySeo: Record<string, CategorySeoEntry>;
  bulkStoreName: string;
  bulkTemplate: string;
  redirects: RedirectRule[];
  facebookPixelId: string;
  gtmContainerId: string;
  abandonedCarts: AbandonedCartRow[];
  searchKeywords: SearchKeywordRow[];
  heatmap: HeatmapRow[];
  journey: JourneyEdge[];
  exitPages: ExitPageRow[];
  visitorsDemo: number;
  purchasesDemo: number;
};

function uid() {
  return `seo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultSeoAnalyticsState(): SeoAnalyticsState {
  const catSeo: Record<string, CategorySeoEntry> = {};
  categories.slice(0, 6).forEach((c) => {
    catSeo[c.slug] = {
      title: `Buy ${c.slug.replace(/-/g, " ")} — Libas Collection`,
      desc: `Curated ${c.slug.replace(/-/g, " ")} — fast delivery & easy returns.`,
    };
  });

  return {
    categorySeo: catSeo,
    bulkStoreName: "Libas Collection",
    bulkTemplate: "{name} - Buy Online at {store}",
    redirects: [],
    facebookPixelId: "",
    gtmContainerId: "",
    abandonedCarts: [],
    searchKeywords: [],
    heatmap: [],
    journey: [],
    exitPages: [],
    visitorsDemo: 0,
    purchasesDemo: 0,
  };
}

function read(): SeoAnalyticsState {
  if (typeof window === "undefined") return defaultSeoAnalyticsState();
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return defaultSeoAnalyticsState();
    const p = JSON.parse(s) as Partial<SeoAnalyticsState>;
    const d = defaultSeoAnalyticsState();
    return {
      ...d,
      ...p,
      categorySeo: { ...d.categorySeo, ...p.categorySeo },
      redirects: Array.isArray(p.redirects) ? p.redirects : d.redirects,
      abandonedCarts: Array.isArray(p.abandonedCarts)
        ? p.abandonedCarts
        : d.abandonedCarts,
      searchKeywords: Array.isArray(p.searchKeywords)
        ? p.searchKeywords
        : d.searchKeywords,
      heatmap: Array.isArray(p.heatmap) ? p.heatmap : d.heatmap,
      journey: Array.isArray(p.journey) ? p.journey : d.journey,
      exitPages: Array.isArray(p.exitPages) ? p.exitPages : d.exitPages,
    };
  } catch {
    return defaultSeoAnalyticsState();
  }
}

export function getSeoAnalytics(): SeoAnalyticsState {
  return read();
}

export function saveSeoAnalytics(next: SeoAnalyticsState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-seo-analytics"));
}

/** Strip locale prefix: /en/product/p1 → /product/p1 */
export function stripLocalePath(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/)/, "") || "/";
}

export function findRedirectForPath(
  pathname: string,
  rules: RedirectRule[]
): string | null {
  const norm = stripLocalePath(pathname);
  const hit = rules.find(
    (r) =>
      norm === r.fromPath ||
      norm.endsWith(r.fromPath) ||
      norm === r.fromPath.replace(/\/$/, "")
  );
  return hit ? hit.toPath : null;
}

export function computeSeoScore(title: string, desc: string): {
  score: number;
  label: "good" | "warn" | "bad";
  hints: string[];
} {
  const hints: string[] = [];
  let score = 50;
  const tl = title.trim().length;
  const dl = desc.trim().length;
  if (tl >= 30 && tl <= 60) {
    score += 25;
  } else {
    hints.push(tl < 30 ? "title_short" : "title_long");
    score += tl < 20 ? -10 : 5;
  }
  if (dl >= 120 && dl <= 160) {
    score += 25;
  } else {
    hints.push(dl < 120 ? "desc_short" : "desc_long");
    score += dl < 80 ? -10 : 5;
  }
  score = Math.max(0, Math.min(100, score));
  const label =
    score >= 70 ? "good" : score >= 45 ? "warn" : "bad";
  return { score, label, hints };
}

export function getMostViewedLeastPurchased(): {
  product: string;
  views: number;
  purchases: number;
  ratio: number;
}[] {
  return [];
}

export function applyBulkSeoTemplate(
  categorySlug: string,
  template: string,
  storeName: string
): number {
  let n = 0;
  for (const p of getStorefrontProducts()) {
    if (p.categorySlug !== categorySlug) continue;
    const title = template
      .replace(/\{name\}/g, p.title)
      .replace(/\{store\}/g, storeName);
    setProductMeta(p.id, { metaTitle: title });
    n++;
  }
  return n;
}

export { buildSitemapXml };

export function downloadSitemapXml(origin: string): void {
  const xml = buildSitemapXml(origin);
  const blob = new Blob([xml], { type: "application/xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sitemap.xml";
  a.click();
  URL.revokeObjectURL(a.href);
}

export { uid };
