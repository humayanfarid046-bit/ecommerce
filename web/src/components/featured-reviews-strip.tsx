"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getFeaturedReviewsForHome,
  type ReviewModeration,
} from "@/lib/support-review-storage";
import { Star } from "lucide-react";
import { STORE_SHELL } from "@/lib/store-layout";

export function FeaturedReviewsStrip() {
  const t = useTranslations("home");
  const [rows, setRows] = useState<ReviewModeration[]>([]);

  useEffect(() => {
    const load = () => setRows(getFeaturedReviewsForHome(4));
    load();
    window.addEventListener("lc-support", load);
    return () => window.removeEventListener("lc-support", load);
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className="border-b border-amber-200/60 bg-gradient-to-b from-amber-50/90 to-white py-5 dark:border-amber-900/30 dark:from-amber-950/40 dark:to-slate-950 md:py-6">
      <div className={`${STORE_SHELL} py-0`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
              {t("featuredReviewsKicker")}
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl">
              {t("featuredReviewsTitle")}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {t("featuredReviewsBadge")}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm dark:border-amber-900/40 dark:bg-slate-900"
            >
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                {r.mediaUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.mediaUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    {t("featuredReviewsNoPhoto")}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {r.productTitle}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {r.rating.toFixed(1)} · {r.user}
                </p>
                <p className="mt-2 line-clamp-3 text-xs text-slate-600 dark:text-slate-400">
                  {r.text}
                </p>
                <Link
                  href={`/product/${r.productId}`}
                  className="mt-3 inline-block text-xs font-bold text-[#2563eb] hover:underline"
                >
                  {t("featuredReviewsCta")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
