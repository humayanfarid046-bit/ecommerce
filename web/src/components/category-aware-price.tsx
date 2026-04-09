"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/storefront-catalog";
import { effectiveUnitPriceAfterCategoryDiscount } from "@/lib/category-discount-storage";
import { cn } from "@/lib/utils";

export function useEffectiveUnitPrice(
  product: Pick<Product, "price" | "categorySlug">
) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-category-discount", fn);
    return () => window.removeEventListener("lc-category-discount", fn);
  }, []);
  return useMemo(
    () =>
      effectiveUnitPriceAfterCategoryDiscount(product.price, product.categorySlug),
    [product.price, product.categorySlug, tick]
  );
}

type Props = {
  product: Product;
  variant?: "card" | "pdp" | "wishlist" | "inline";
  className?: string;
};

/**
 * Selling price with optional admin category-wide % off (localStorage).
 * Keeps cart/checkout math aligned with browse UI.
 */
export function CategoryAwarePrice({ product, variant = "card", className }: Props) {
  const effective = useEffectiveUnitPrice(product);
  const tProduct = useTranslations("product");
  const tCard = useTranslations("productCard");
  const hasCatDisc = effective < product.price;
  const showMrp = product.mrp > product.price;

  if (variant === "inline") {
    return (
      <span className={className}>
        ₹{effective.toLocaleString("en-IN")}
      </span>
    );
  }

  if (variant === "wishlist") {
    return (
      <div className={cn("mt-2 flex flex-wrap items-baseline gap-2", className)}>
        <span className="text-lg font-bold text-slate-900">
          ₹{effective.toLocaleString("en-IN")}
        </span>
        {hasCatDisc ? (
          <span className="text-xs text-neutral-400 line-through">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        ) : null}
        {showMrp ? (
          <span className="text-xs text-neutral-400 line-through">
            ₹{product.mrp.toLocaleString("en-IN")}
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === "pdp") {
    return (
      <div className={cn("mb-5 flex flex-wrap items-baseline gap-3", className)}>
        <span className="text-3xl font-bold text-[#1F2937] dark:text-slate-100">
          ₹{effective.toLocaleString("en-IN")}
        </span>
        {hasCatDisc ? (
          <span className="text-lg text-rose-600 line-through decoration-rose-400/80 dark:text-rose-400">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        ) : null}
        {showMrp ? (
          <>
            <span className="text-lg text-neutral-400 line-through decoration-neutral-400 dark:text-neutral-500">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
            <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              {tProduct("percentOff", { n: product.discountPct })}
            </span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("mt-auto flex flex-wrap items-center gap-2 pt-1", className)}>
      <span className="text-base font-bold text-[#1F2937]">
        ₹{effective.toLocaleString("en-IN")}
      </span>
      {hasCatDisc ? (
        <span className="text-sm text-slate-400 line-through decoration-slate-400">
          ₹{product.price.toLocaleString("en-IN")}
        </span>
      ) : null}
      {showMrp ? (
        <>
          <span className="text-sm text-slate-400 line-through decoration-slate-400">
            ₹{product.mrp.toLocaleString("en-IN")}
          </span>
          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100">
            {product.discountPct}% {tCard("off")}
          </span>
        </>
      ) : null}
    </div>
  );
}
