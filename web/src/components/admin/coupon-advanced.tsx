"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { categories } from "@/lib/storefront-catalog";
import { Tag } from "lucide-react";

export function CouponAdvanced() {
  const t = useTranslations("admin");
  const tc = useTranslations("categories");
  const [code, setCode] = useState("SAVE20");
  const [pct, setPct] = useState(20);
  const [usageLimit, setUsageLimit] = useState(1);
  const [minSpend, setMinSpend] = useState(500);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [catSlug, setCatSlug] = useState("");

  const catOptions = useMemo(() => categories.map((c) => c.slug), []);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
        <Tag className="h-5 w-5 text-[#0066ff]" />
        {t("couponAdvancedTitle")}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-bold text-slate-500">
          {t("couponCode")}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("couponPercent")}
          <input
            type="number"
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("couponUsageLimit")}
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("couponMinSpend")}
          <input
            type="number"
            min={0}
            value={minSpend}
            onChange={(e) => setMinSpend(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("couponStart")}
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("couponEnd")}
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="text-xs font-bold text-slate-500 sm:col-span-2 lg:col-span-3">
          {t("couponCategoryScope")}
          <select
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="">{t("couponAllProducts")}</option>
            {catOptions.map((slug) => (
              <option key={slug} value={slug}>
                {tc(slug)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white"
      >
        {t("createCoupon")}
      </button>
      <p className="text-[11px] text-slate-400">{t("couponDemoNote")}</p>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {t("couponUsageChart")}
        </p>
        <p className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
          {t("couponUsageChartEmpty")}
        </p>
      </div>
    </div>
  );
}
