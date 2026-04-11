"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { StarCounts } from "@/lib/product-trust";

type Props = {
  breakdown: StarCounts;
  reviewCount: number;
};

export function RatingBreakdownChart({ breakdown, reviewCount }: Props) {
  const t = useTranslations("product.trust");
  const total = useMemo(
    () => (Object.values(breakdown) as number[]).reduce((a, b) => a + b, 0),
    [breakdown]
  );
  const max = Math.max(...(Object.values(breakdown) as number[]), 1);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary dark:text-slate-400">
        {t("ratingBreakdown")}
      </p>
      <p className="text-xs font-medium text-text-secondary dark:text-slate-400">
        {t("basedOnReviews", { count: reviewCount })}
      </p>
      <div className="space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const n = breakdown[star];
          const pct = total ? (n / total) * 100 : 0;
          const barW = max ? (n / max) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-semibold text-text-primary dark:text-slate-200">
                {star}★
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                  style={{ width: `${barW}%` }}
                />
              </div>
              <span className="w-10 text-right tabular-nums font-medium text-text-secondary dark:text-slate-300">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
