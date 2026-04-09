"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { categories } from "@/lib/storefront-catalog";
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

export function HomePageContent() {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  const [tick, setTick] = useState(0);
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

  const featured = catalog.slice(0, 8);

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
            return (
              <section key={raw}>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                  {t("shopByCategory")}
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 md:mt-6">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      className="glass flex flex-col items-center gap-3 rounded-3xl p-6 text-center transition hover:shadow-[0_12px_40px_rgba(0,102,255,0.15)]"
                    >
                      <span className="text-4xl" aria-hidden>
                        {c.icon}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {tc(c.slug)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
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
                <div className={`mt-5 md:mt-6 ${PRODUCT_GRID}`}>
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} showTopOffer />
                  ))}
                </div>
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
