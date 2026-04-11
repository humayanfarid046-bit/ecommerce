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
    () => {
      void tick;
      return effectiveUnitPriceAfterCategoryDiscount(
        product.price,
        product.categorySlug
      );
    },
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
        <span className="text-lg font-bold text-text-primary">
          ₹{effective.toLocaleString("en-IN")}
        </span>
        {hasCatDisc ? (
          <span className="text-xs font-medium text-text-secondary line-through decoration-text-secondary/80">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        ) : null}
        {showMrp ? (
          <span className="text-xs font-medium text-text-secondary line-through decoration-text-secondary/80">
            ₹{product.mrp.toLocaleString("en-IN")}
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === "pdp") {
    return (
      <div className={cn("mb-5 flex flex-wrap items-baseline gap-3", className)}>
        <span className="text-3xl font-bold text-text-primary dark:text-slate-100">
          ₹{effective.toLocaleString("en-IN")}
        </span>
        {hasCatDisc ? (
          <span className="text-lg text-rose-600 line-through decoration-rose-400/80 dark:text-rose-400">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        ) : null}
        {showMrp ? (
          <>
            <span className="text-lg font-medium text-text-secondary line-through decoration-text-secondary/80 dark:text-neutral-500">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
            <span className="rounded-md bg-emerald-800 px-2 py-0.5 text-xs font-extrabold text-white shadow-sm ring-1 ring-black/10 dark:bg-emerald-700">
              {tProduct("percentOff", { n: product.discountPct })}
            </span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 pt-1 font-sans tabular-nums",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-bold tracking-tight text-text-primary dark:text-slate-100">
          ₹{effective.toLocaleString("en-IN")}
        </span>
        {hasCatDisc ? (
          <span className="text-xs font-medium text-text-secondary line-through decoration-text-secondary/80 dark:text-slate-500">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        ) : null}
        {showMrp ? (
          <span className="text-xs font-medium text-text-secondary line-through decoration-text-secondary/80 dark:text-slate-500">
            ₹{product.mrp.toLocaleString("en-IN")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
