"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product-card";
import {
  filterProducts,
  searchProducts,
  sortProductsByParam,
} from "@/lib/mock-data";
import { PRODUCT_GRID, STORE_SHELL } from "@/lib/store-layout";
import { FilterListingShell } from "@/components/filter-listing-shell";
import { useCatalogProducts } from "@/hooks/use-catalog-products";

type Sp = {
  q?: string;
  min?: string;
  max?: string;
  rating?: string;
  discount?: string;
  stock?: string;
  visual?: string;
  sort?: string;
};

export function SearchListingClient({ sp }: { sp: Sp }) {
  const catalog = useCatalogProducts();
  const t = useTranslations("searchPage");

  const list = useMemo(() => {
    const q = sp.q ?? "";
    const visualMode = sp.visual === "1";
    void visualMode;
    let rows = searchProducts(q);
    if (!q.trim()) rows = catalog;
    const minPrice = sp.min ? Number(sp.min) : undefined;
    const maxPrice = sp.max ? Number(sp.max) : undefined;
    const minRating = sp.rating ? Number(sp.rating) : undefined;
    const discountMin = sp.discount ? Number(sp.discount) : undefined;
    const inStockOnly = sp.stock === "1";
    rows = filterProducts(rows, {
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      minRating: Number.isFinite(minRating) ? minRating : undefined,
      discountMin: Number.isFinite(discountMin) ? discountMin : undefined,
      inStockOnly,
    });
    return sortProductsByParam(rows, sp.sort);
  }, [catalog, sp]);

  const maxP = Math.max(0, 100000, ...catalog.map((p) => p.price));
  const q = sp.q ?? "";
  const visualMode = sp.visual === "1";

  return (
    <div className="w-full bg-slate-50/40 dark:bg-slate-950/40">
      <div className={`${STORE_SHELL} py-8`}>
        <FilterListingShell maxPriceDefault={maxP || 100000} basePath="/search">
          {visualMode ? (
            <p className="mb-3 rounded-2xl border border-[#0066ff]/25 bg-[#0066ff]/10 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-[#0066ff]/35 dark:bg-[#0066ff]/15 dark:text-slate-100">
              {t("visualBanner")}
            </p>
          ) : null}
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl">
            {q ? t("resultsFor", { q }) : t("allProducts")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("productCount", { count: list.length })}
          </p>
          <div className={`mt-6 ${PRODUCT_GRID}`}>
            {list.map((p) => (
              <ProductCard key={p.id} product={p} showTopOffer={false} />
            ))}
          </div>
          {list.length === 0 && (
            <p className="mt-8 text-neutral-500 dark:text-neutral-400">
              {t("noMatch")}
            </p>
          )}
        </FilterListingShell>
      </div>
    </div>
  );
}
