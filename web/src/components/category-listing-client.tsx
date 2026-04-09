"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product-card";
import {
  filterProducts,
  sortProductsByParam,
} from "@/lib/storefront-catalog";
import { PRODUCT_GRID, STORE_SHELL } from "@/lib/store-layout";
import { FilterListingShell } from "@/components/filter-listing-shell";
import { useCatalogProducts } from "@/hooks/use-catalog-products";

type Sp = {
  sub?: string;
  min?: string;
  max?: string;
  rating?: string;
  discount?: string;
  stock?: string;
  sort?: string;
};

export function CategoryListingClient({
  slug,
  icon,
  sp,
}: {
  slug: string;
  icon: string;
  sp: Sp;
}) {
  const products = useCatalogProducts();
  const tc = useTranslations("categories");
  const ts = useTranslations("categorySub");
  const tpc = useTranslations("categoryPage");

  const list = useMemo(() => {
    let rows = products.filter((p) => p.categorySlug === slug);
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
  }, [products, slug, sp]);

  const maxP = Math.max(0, 100000, ...products.map((p) => p.price));
  const subLabel = sp.sub ? ts(sp.sub) : null;

  return (
    <div className="w-full bg-slate-50/40 dark:bg-slate-950/40">
      <div className={`${STORE_SHELL} py-8`}>
        <FilterListingShell
          maxPriceDefault={maxP || 100000}
          basePath={`/category/${slug}`}
          subLabel={subLabel}
        >
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl">
            <span aria-hidden>{icon} </span>
            {tc(slug)}
            {subLabel ? (
              <span className="text-neutral-500 dark:text-neutral-400">
                {" "}
                / {subLabel}
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {tpc("productCount", { count: list.length })}
          </p>
          <div className={`mt-6 ${PRODUCT_GRID}`}>
            {list.map((p) => (
              <ProductCard key={p.id} product={p} showTopOffer={false} />
            ))}
          </div>
          {list.length === 0 && (
            <p className="mt-8 text-neutral-500 dark:text-neutral-400">
              {tpc("empty")}
            </p>
          )}
        </FilterListingShell>
      </div>
    </div>
  );
}
