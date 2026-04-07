"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/context/wishlist-context";
import { useRecent } from "@/context/recent-context";
import { getProductById, categories } from "@/lib/mock-data";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

/** Picks dominant category from wishlist + recent views for personalized copy. */
export function PersonalizedHomeBanner() {
  const { ids: wishIds } = useWishlist();
  const { productIds: recentIds } = useRecent();
  const t = useTranslations("personalized");

  const dominantSlug = useMemo(() => {
    const counts = new Map<string, number>();
    const add = (id: string) => {
      const p = getProductById(id);
      if (!p) return;
      counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 2);
    };
    wishIds.forEach(add);
    recentIds.forEach((id) => {
      const p = getProductById(id);
      if (!p) return;
      counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
    });
    let best = categories[0]!.slug;
    let max = 0;
    for (const [slug, n] of counts) {
      if (n > max) {
        max = n;
        best = slug;
      }
    }
    return best;
  }, [wishIds, recentIds]);

  const tc = useTranslations("categories");
  const label = tc(dominantSlug);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-3">
      <div className="relative overflow-hidden rounded-2xl border border-[#0066ff]/20 bg-gradient-to-br from-[#0066ff]/10 via-white to-violet-50/80 p-4 shadow-[0_12px_36px_rgba(0,102,255,0.1)] dark:border-[#0066ff]/30 dark:from-[#0066ff]/20 dark:via-slate-900 dark:to-violet-950/50 md:p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0066ff]/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066ff] dark:text-[#7cb4ff]">
                {t("eyebrow")}
              </p>
              <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50 md:text-lg">
                {t("title", { category: label })}
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <Link
            href={`/category/${dominantSlug}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0066ff] px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_20px_rgba(0,102,255,0.35)] transition hover:bg-[#0052cc] md:self-center md:px-5 md:text-sm"
          >
            {t("cta", { category: label })}
          </Link>
        </div>
      </div>
    </div>
  );
}
