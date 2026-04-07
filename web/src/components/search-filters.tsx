"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = {
  maxPriceDefault: number;
  basePath?: string;
  /** Drawer / panel: no sticky positioning. */
  embedded?: boolean;
  /** Called after Apply or Reset navigation. */
  onApplied?: () => void;
};

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 " +
  "hover:border-[#0066ff]/45 hover:shadow-[0_2px_12px_rgba(0,102,255,0.08)] " +
  "focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 focus:ring-offset-0";

export function SearchFilters({
  maxPriceDefault,
  basePath = "/search",
  embedded = false,
  onApplied,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("filters");
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");
  const [rating, setRating] = useState(sp.get("rating") ?? "");
  const [discount, setDiscount] = useState(sp.get("discount") ?? "");
  const [stockOnly, setStockOnly] = useState(sp.get("stock") === "1");
  const [sort, setSort] = useState(sp.get("sort") ?? "");

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams(sp.toString());
    const setOrDel = (k: string, v: string) => {
      if (v) q.set(k, v);
      else q.delete(k);
    };
    setOrDel("min", min);
    setOrDel("max", max);
    q.delete("brand");
    setOrDel("rating", rating);
    setOrDel("discount", discount);
    setOrDel("sort", sort);
    if (stockOnly) q.set("stock", "1");
    else q.delete("stock");
    const qterm = sp.get("q");
    if (qterm) q.set("q", qterm);
    const visual = sp.get("visual");
    if (visual) q.set("visual", visual);
    const sub = sp.get("sub");
    if (sub) q.set("sub", sub);
    return q.toString();
  }, [sp, min, max, rating, discount, stockOnly, sort]);

  const apply = useCallback(() => {
    startTransition(() => {
      router.push(`${basePath}?${buildQuery()}`);
      onApplied?.();
    });
  }, [router, buildQuery, basePath, onApplied]);

  const reset = useCallback(() => {
    setMin("");
    setMax("");
    setRating("");
    setDiscount("");
    setSort("");
    setStockOnly(false);
    startTransition(() => {
      const q = new URLSearchParams();
      const qterm = sp.get("q");
      if (qterm) q.set("q", qterm);
      const visual = sp.get("visual");
      if (visual) q.set("visual", visual);
      const sub = sp.get("sub");
      if (sub) q.set("sub", sub);
      router.push(`${basePath}?${q.toString()}`);
      onApplied?.();
    });
  }, [router, sp, basePath, onApplied]);

  const maxStr = maxPriceDefault.toLocaleString("en-IN");

  return (
    <aside className="group">
      <div
        className={cn(
          "glass overflow-hidden rounded-3xl border border-white/60 p-1 shadow-[0_8px_32px_rgba(0,102,255,0.08)] transition-all duration-300 dark:border-slate-600/40",
          !embedded && "sticky top-24",
          "hover:border-[#0066ff]/20 hover:shadow-[0_12px_40px_rgba(0,102,255,0.12)]"
        )}
      >
        <div className="rounded-[1.35rem] bg-white/40 p-4 backdrop-blur-md md:p-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff]/15 to-[#7c3aed]/10 text-[#0066ff] transition-transform duration-200 group-hover:scale-105">
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                {t("title")}
              </span>
            </div>
            {pending && (
              <span className="shrink-0 animate-pulse rounded-full bg-[#0066ff]/15 px-2.5 py-1 text-xs font-semibold text-[#0066ff]">
                {t("updating")}
              </span>
            )}
          </div>

          <div className="space-y-5 pt-5">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                {t("priceRange")}
              </p>
              <div className="mt-2.5 flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={t("min")}
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  className={inputClass}
                  aria-label={t("min")}
                />
                <input
                  type="number"
                  min={0}
                  placeholder={t("max")}
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  className={inputClass}
                  aria-label={t("max")}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {t("upTo", { amount: maxStr })}
              </p>
            </div>

            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                {t("sortLabel")}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={cn(inputClass, "mt-2.5 cursor-pointer")}
              >
                <option value="">{t("sortDefault")}</option>
                <option value="price-asc">{t("sortPriceAsc")}</option>
                <option value="price-desc">{t("sortPriceDesc")}</option>
              </select>
            </div>

            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                {t("minRating")}
              </p>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className={cn(inputClass, "mt-2.5 cursor-pointer")}
              >
                <option value="">{t("any")}</option>
                <option value="4">{t("starsUp4")}</option>
                <option value="3">{t("starsUp3")}</option>
              </select>
            </div>

            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                {t("minDiscount")}
              </p>
              <input
                type="number"
                min={0}
                max={100}
                placeholder={t("discountPlaceholder")}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className={cn(inputClass, "mt-2.5")}
              />
            </div>

            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 -mx-2 transition-all duration-200",
                "hover:border-slate-200/90 hover:bg-white/60",
                "focus-within:ring-2 focus-within:ring-[#0066ff]/25"
              )}
            >
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={(e) => setStockOnly(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#0066ff] transition hover:border-[#0066ff]/60 focus:ring-[#0066ff]/25"
              />
              <span className="text-sm font-semibold text-slate-700 select-none">
                {t("inStockOnly")}
              </span>
            </label>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={apply}
                className={cn(
                  "flex-1 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0052cc] py-2.5 text-sm font-extrabold text-white shadow-md shadow-[#0066ff]/30",
                  "transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0066ff]/35",
                  "active:translate-y-0 active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff]/50 focus-visible:ring-offset-2"
                )}
              >
                {t("apply")}
              </button>
              <button
                type="button"
                onClick={reset}
                className={cn(
                  "shrink-0 rounded-xl border-2 border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600",
                  "transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-[#0066ff]/35 hover:bg-[#0066ff]/5 hover:text-[#0066ff]",
                  "active:translate-y-0 active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff]/30"
                )}
              >
                {t("reset")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
