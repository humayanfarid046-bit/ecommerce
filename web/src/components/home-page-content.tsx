"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/product-card";
import { ContinueShoppingSection } from "@/components/continue-shopping-section";
import { InstagramFeed } from "@/components/instagram-feed";
import { StoreShareBar } from "@/components/store-share-bar";
import {
  getCms,
  parseSectionKey,
  getProductsForCustomSection,
  defaultCmsState,
} from "@/lib/cms-storage";
import { PRODUCT_GRID, STORE_SHELL } from "@/lib/store-layout";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { CATALOG_EVENT } from "@/lib/catalog-products-storage";

const FEATURED_PAGE = 8;

export function HomePageContent() {
  const t = useTranslations("home");
  const [tick, setTick] = useState(0);
  const [featuredVisible, setFeaturedVisible] = useState(FEATURED_PAGE);
  const catalog = useCatalogProducts();

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-cms", fn);
    window.addEventListener(CATALOG_EVENT, fn);
    return () => {
      window.removeEventListener("lc-cms", fn);
      window.removeEventListener(CATALOG_EVENT, fn);
    };
  }, []);

  void tick;
  const cms = getCms();
  const order =
    cms.sectionOrder.length > 0
      ? cms.sectionOrder
      : defaultCmsState().sectionOrder;

  const featuredSlice = catalog.slice(0, featuredVisible);
  const canLoadMoreFeatured = catalog.length > featuredVisible;

  return (
    <div className={`${STORE_SHELL} py-5 md:py-7`}>
      {order.map((raw, idx) => {
        const parsed = parseSectionKey(raw);
        if (!parsed) return null;
        const blockGap = idx > 0 ? "mt-8 md:mt-12" : "";

        if (parsed.type === "custom") {
          const sec = cms.customSections.find((c) => c.id === parsed.id);
          if (!sec) return null;
          const list = getProductsForCustomSection(sec);
          if (!list.length) return null;
          return (
            <section key={raw} className={blockGap}>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                {sec.title}
              </h2>
              <div className={`mt-5 md:mt-6 ${PRODUCT_GRID}`}>
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} showTopOffer />
                ))}
              </div>
            </section>
          );
        }

        switch (parsed.key) {
          case "categories":
            /* Categories live in drawer (mobile) + header strip (desktop); no duplicate grid under hero. */
            return null;
          case "featured":
            return (
              <section key={raw} className={blockGap}>
                <div className="flex items-end justify-between gap-4">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                    {t("featuredProducts")}
                  </h2>
                  <Link
                    href="/search"
                    className="text-sm font-bold text-[#0066ff] transition hover:text-[#0052cc]"
                  >
                    {t("viewAll")}
                  </Link>
                </div>
                {catalog.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t("featuredShowing", {
                      visible: featuredSlice.length,
                      total: catalog.length,
                    })}
                  </p>
                ) : null}
                <div className={`mt-5 md:mt-6 ${PRODUCT_GRID}`}>
                  {featuredSlice.map((p) => (
                    <ProductCard key={p.id} product={p} showTopOffer />
                  ))}
                </div>
                {canLoadMoreFeatured ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setFeaturedVisible((v) =>
                          Math.min(v + FEATURED_PAGE, catalog.length)
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-[#0066ff]/40 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {t("loadMore")}
                    </button>
                  </div>
                ) : null}
              </section>
            );
          case "continue":
            return (
              <div key={raw} className={blockGap}>
                <ContinueShoppingSection />
              </div>
            );
          case "instagram":
            return (
              <div key={raw} className={blockGap}>
                <InstagramFeed />
              </div>
            );
          default:
            return null;
        }
      })}
      <StoreShareBar />
    </div>
  );
}
