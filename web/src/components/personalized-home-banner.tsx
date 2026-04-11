"use client";

import { useMemo, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/context/wishlist-context";
import { useRecent } from "@/context/recent-context";
import { getProductById, categories } from "@/lib/storefront-catalog";
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

  const meshBackground: CSSProperties = {
    background: `
      radial-gradient(ellipse 110% 85% at 12% 25%, rgba(37, 99, 235, 0.55), transparent 58%),
      radial-gradient(ellipse 95% 75% at 88% 8%, rgba(124, 58, 246, 0.52), transparent 52%),
      radial-gradient(ellipse 70% 55% at 75% 92%, rgba(99, 102, 241, 0.38), transparent 48%),
      radial-gradient(ellipse 50% 45% at 35% 88%, rgba(59, 130, 246, 0.22), transparent 50%),
      linear-gradient(145deg, #071021 0%, #0f1f4a 32%, #1e1b4b 58%, #4c1d95 100%)
    `,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-3">
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.12] p-4 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.55)] md:p-5">
        <div
          className="pointer-events-none absolute inset-0 rounded-[24px]"
          style={meshBackground}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-t from-black/25 via-transparent to-white/[0.04]" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-inner shadow-white/10 backdrop-blur-md">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/95">
                {t("eyebrow")}
              </p>
              <h2 className="mt-1 text-lg font-semibold leading-snug tracking-[-0.02em] text-white md:text-xl">
                {t("title", { category: label })}
              </h2>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/70">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <Link
            href={`/category/${dominantSlug}`}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/25 bg-white px-5 py-2.5 text-xs font-semibold text-indigo-950 shadow-[0_2px_12px_rgba(255,255,255,0.35),0_8px_28px_rgba(99,102,241,0.45),0_0_42px_rgba(167,139,250,0.35)] transition hover:border-white/40 hover:brightness-[1.03] hover:shadow-[0_4px_20px_rgba(255,255,255,0.4),0_12px_36px_rgba(124,58,237,0.45),0_0_52px_rgba(99,102,241,0.4)] md:self-center md:px-6 md:text-sm"
          >
            {t("cta", { category: label })}
          </Link>
        </div>
      </div>
    </div>
  );
}
