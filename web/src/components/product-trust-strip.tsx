"use client";

import { Eye, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/mock-data";
import { getTrustSignals } from "@/lib/product-trust";

type Props = { product: Product };

export function ProductTrustStrip({ product }: Props) {
  const t = useTranslations("product.trust");
  const { stockLeft, viewers } = getTrustSignals(product);

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#0066ff]/15 bg-[#0066ff]/[0.06] px-4 py-3 text-sm dark:border-[#0066ff]/25 dark:bg-[#0066ff]/10">
      {product.inStock && stockLeft <= 8 ? (
        <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
          <Package className="h-4 w-4 shrink-0" />
          {t("onlyLeft", { count: stockLeft })}
        </p>
      ) : null}
      {!product.inStock ? (
        <p className="font-semibold text-rose-700 dark:text-rose-300">
          {t("highDemand")}
        </p>
      ) : null}
      <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Eye className="h-4 w-4 shrink-0 text-[#0066ff]" />
        {t("viewersNow", { count: viewers })}
      </p>
    </div>
  );
}
