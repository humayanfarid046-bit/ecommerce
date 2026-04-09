"use client";

import { useMemo } from "react";
import { useRecent } from "@/context/recent-context";
import { getProductById } from "@/lib/storefront-catalog";
import { ProductCard } from "@/components/product-card";
import { useTranslations } from "next-intl";
import { PRODUCT_GRID } from "@/lib/store-layout";

export function ContinueShoppingSection() {
  const { productIds } = useRecent();
  const t = useTranslations("home");

  const products = useMemo(() => {
    return productIds
      .map((id) => getProductById(id))
      .filter((p): p is NonNullable<typeof p> => p != null)
      .slice(0, 4);
  }, [productIds]);

  if (products.length === 0) return null;

  return (
    <section className="mt-8 border-t border-slate-200/90 pt-8 dark:border-slate-800 md:mt-10 md:pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl">
            {t("continueShopping")}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t("continueShoppingSubtitle")}
          </p>
        </div>
      </div>
      <div className={`mt-4 md:mt-5 ${PRODUCT_GRID}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} showTopOffer={false} />
        ))}
      </div>
    </section>
  );
}
