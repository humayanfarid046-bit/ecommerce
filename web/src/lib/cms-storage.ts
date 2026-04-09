/** Client-only CMS / homepage config. */

import { getStorefrontProducts } from "@/lib/catalog-products-storage";

const KEY = "lc_cms_v1";

export type BannerHrefType = "product" | "category" | "custom";

export type CmsBannerSlide = {
  id: string;
  active: boolean;
  desktopUrl: string;
  mobileUrl: string;
  hrefType: BannerHrefType;
  /** product id, category slug, or path starting with / */
  href: string;
  /** ISO datetime or null = no expiry */
  expiresAt: string | null;
  sortOrder: number;
};

export type CmsCustomSection = {
  id: string;
  title: string;
  productIds: string[];
  limit: number;
};

/** Built-in home section keys (orderable). */
export type HomeSectionKey =
  | "categories"
  | "featured"
  | "continue"
  | "instagram";

export type CmsState = {
  banners: CmsBannerSlide[];
  /** Order of sections + custom:uuid */
  sectionOrder: string[];
  customSections: CmsCustomSection[];
  flashSale: {
    enabled: boolean;
    endAt: string;
    label: string;
  };
  announcement: {
    active: boolean;
    text: string;
  };
  popup: {
    enabled: boolean;
    title: string;
    body: string;
    couponCode: string;
    imageUrl: string;
  };
  seo: {
    metaTitle: string;
    metaDesc: string;
    faviconUrl: string;
    ogImageUrl: string;
  };
  /** Demo analytics for last campaign */
  notificationStats: {
    sent: number;
    opened: number;
    clicks: number;
  };
  notificationAudience: "all" | "inactive_30d" | "high_value";
  /** Rich push / in-app campaign draft (demo). */
  notificationCampaign: {
    title: string;
    body: string;
    imageUrl: string;
    ctaLabel: string;
    hrefType: BannerHrefType;
    href: string;
  };
  whatsappTemplates: {
    orderConfirm: string;
    orderShipped: string;
  };
};

function uid() {
  return `cms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultCmsState(): CmsState {
  return {
    banners: [],
    sectionOrder: ["categories", "featured", "continue", "instagram"],
    customSections: [],
    flashSale: {
      enabled: false,
      endAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      label: "Flash weekend",
    },
    announcement: {
      active: false,
      text: "",
    },
    popup: {
      enabled: false,
      title: "",
      body: "",
      couponCode: "",
      imageUrl: "",
    },
    seo: {
      metaTitle: "",
      metaDesc: "",
      faviconUrl: "",
      ogImageUrl: "",
    },
    notificationStats: { sent: 0, opened: 0, clicks: 0 },
    notificationAudience: "all",
    notificationCampaign: {
      title: "",
      body: "",
      imageUrl: "",
      ctaLabel: "",
      hrefType: "category",
      href: "mens-wear",
    },
    whatsappTemplates: {
      orderConfirm:
        "Hi {{name}}, your order {{orderId}} is confirmed. — Libas Collection",
      orderShipped:
        "Your order {{orderId}} is out for delivery. Track: {{link}} — Libas",
    },
  };
}

function read(): CmsState {
  if (typeof window === "undefined") return defaultCmsState();
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return defaultCmsState();
    const p = JSON.parse(s) as Partial<CmsState>;
    const d = defaultCmsState();
    return {
      ...d,
      ...p,
      banners: p.banners?.length ? p.banners : d.banners,
      sectionOrder: p.sectionOrder?.length ? p.sectionOrder : d.sectionOrder,
      customSections: p.customSections ?? d.customSections,
      flashSale: { ...d.flashSale, ...p.flashSale },
      announcement: { ...d.announcement, ...p.announcement },
      popup: { ...d.popup, ...p.popup },
      seo: { ...d.seo, ...p.seo },
      notificationStats: { ...d.notificationStats, ...p.notificationStats },
      notificationCampaign: {
        ...d.notificationCampaign,
        ...p.notificationCampaign,
      },
      whatsappTemplates: { ...d.whatsappTemplates, ...p.whatsappTemplates },
    };
  } catch {
    return defaultCmsState();
  }
}

export function getCms(): CmsState {
  return read();
}

export function saveCms(next: CmsState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-cms"));
}

export function dispatchCmsEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lc-cms"));
}

export function isBannerExpired(slide: CmsBannerSlide): boolean {
  if (!slide.expiresAt) return false;
  const t = new Date(slide.expiresAt).getTime();
  return Number.isFinite(t) && Date.now() > t;
}

export function activeBannersNow(state: CmsState): CmsBannerSlide[] {
  return [...state.banners]
    .filter((b) => b.active && !isBannerExpired(b))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resolveBannerHref(slide: CmsBannerSlide): string {
  if (slide.hrefType === "product") return `/product/${slide.href}`;
  if (slide.hrefType === "category") return `/category/${slide.href}`;
  return slide.href.startsWith("/") ? slide.href : `/${slide.href}`;
}

export function getProductsForCustomSection(sec: CmsCustomSection) {
  const lim = Math.min(Math.max(sec.limit, 1), 24);
  if (!sec.productIds.length) return [];
  const set = new Set(sec.productIds);
  return getStorefrontProducts().filter((p) => set.has(p.id)).slice(0, lim);
}

export const homeSectionLabels: Record<HomeSectionKey, string> = {
  categories: "Shop by category",
  featured: "Featured products",
  continue: "Continue shopping",
  instagram: "Instagram",
};

export function parseSectionKey(raw: string): { type: "builtin"; key: HomeSectionKey } | { type: "custom"; id: string } | null {
  if (raw.startsWith("custom:")) return { type: "custom", id: raw.slice(7) };
  if (
    raw === "categories" ||
    raw === "featured" ||
    raw === "continue" ||
    raw === "instagram"
  ) {
    return { type: "builtin", key: raw };
  }
  return null;
}

export { uid };
