"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useCompare } from "@/context/compare-context";
import { getProductById, type Product } from "@/lib/storefront-catalog";
import { effectiveUnitPriceAfterCategoryDiscount } from "@/lib/category-discount-storage";
import { useTranslations } from "next-intl";
import { Scale, Star, Trash2 } from "lucide-react";
import {
  appCard,
  appHeading,
  gradientCta,
  innerPageShellMax,
  innerPageShellWide,
} from "@/lib/app-inner-ui";

export function ComparePageClient() {
  const { ids, remove, clear } = useCompare();
  const t = useTranslations("compare");
  const [catDiscTick, setCatDiscTick] = useState(0);
  useEffect(() => {
    const fn = () => setCatDiscTick((n) => n + 1);
    window.addEventListener("lc-category-discount", fn);
    return () => window.removeEventListener("lc-category-discount", fn);
  }, []);

  const products = ids
    .map((id) => getProductById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];

  const rows: { label: string; values: string[] }[] = useMemo(() => {
    void catDiscTick;
    const ru = (p: Product) =>
      effectiveUnitPriceAfterCategoryDiscount(p.price, p.categorySlug);
    return [
      {
        label: t("rowPrice"),
        values: products.map((p) => `₹${ru(p).toLocaleString("en-IN")}`),
      },
      {
        label: t("rowMrp"),
        values: products.map((p) => `₹${p.mrp.toLocaleString("en-IN")}`),
      },
      {
        label: t("rowDiscount"),
        values: products.map((p) => `${p.discountPct}%`),
      },
      {
        label: t("rowRating"),
        values: products.map((p) => `${p.rating} (${p.reviewCount})`),
      },
      {
        label: t("rowBrand"),
        values: products.map((p) => p.brand),
      },
      {
        label: t("rowStock"),
        values: products.map((p) => (p.inStock ? t("inStock") : t("outOfStock"))),
      },
    ];
  }, [products, t, catDiscTick]);

  if (products.length === 0) {
    return (
      <div className={`${innerPageShellWide} text-center`}>
        <div className={`${appCard} mx-auto max-w-md p-8 sm:p-10`}>
          <Scale className="mx-auto h-14 w-14 text-text-secondary/80 dark:text-slate-500" />
          <h1 className={`${appHeading} mt-4 text-xl sm:text-2xl`}>
            {t("emptyTitle")}
          </h1>
          <p className="mt-2 text-sm font-medium text-text-secondary dark:text-slate-400">
            {t("emptyBody")}
          </p>
          <Link
            href="/search"
            className={`${gradientCta} mt-6 inline-block px-6 py-3 text-sm font-bold`}
          >
            {t("browse")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={innerPageShellMax}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={`${appHeading} text-xl sm:text-2xl`}>{t("title")}</h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm font-semibold text-rose-600 hover:underline"
        >
          {t("clearAll")}
        </button>
      </div>

      <div
        className={`${appCard} mt-8 overflow-x-auto rounded-[18px] border-white/[0.07] p-0 dark:border-white/[0.07]`}
      >
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/90 dark:border-white/[0.07] dark:bg-[#1a2235]">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-[#1a2235] dark:text-slate-400">
                {t("feature")}
              </th>
              {products.map((p) => (
                <th key={p.id} className="min-w-[180px] px-4 py-3 align-top">
                  <div className="relative mx-auto w-full max-w-[160px]">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1.5 text-rose-600 shadow dark:bg-slate-900"
                      aria-label={t("remove")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                      <Image
                        src={p.images[0]!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <Link
                      href={`/product/${p.id}`}
                      className="mt-2 line-clamp-2 block text-left text-xs font-bold text-text-primary hover:text-[#0066ff] dark:text-slate-100"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-semibold">{p.rating}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="sticky left-0 bg-white px-4 py-3 text-xs font-bold text-text-secondary dark:bg-[#161d2b] dark:text-slate-300">
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={products[i]!.id + row.label}
                    className="px-4 py-3 text-center font-medium text-text-primary dark:text-slate-200"
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 bg-white px-4 py-4 dark:bg-[#161d2b]" />
              {products.map((p) => (
                <td key={p.id} className="px-4 py-4 text-center">
                  <Link
                    href={`/product/${p.id}`}
                    className={`${gradientCta} inline-block px-4 py-2 text-xs font-bold`}
                  >
                    {t("viewProduct")}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
