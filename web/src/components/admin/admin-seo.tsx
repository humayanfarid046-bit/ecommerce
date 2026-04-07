"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { categories } from "@/lib/mock-data";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { wishlistBehaviorDemo } from "@/lib/admin-mock-data";
import {
  applyBulkSeoTemplate,
  computeSeoScore,
  defaultSeoAnalyticsState,
  downloadSitemapXml,
  getMostViewedLeastPurchased,
  getSeoAnalytics,
  saveSeoAnalytics,
  uid,
  type SeoAnalyticsState,
} from "@/lib/seo-analytics-storage";
import { GoogleSnippetPreview } from "@/components/google-snippet-preview";
import {
  BarChart3,
  Download,
  Globe,
  Link2,
  MousePointerClick,
  Percent,
  Radar,
  Search,
  ShoppingCart,
  Target,
} from "lucide-react";

export function AdminSeo() {
  const t = useTranslations("admin");
  const products = useCatalogProducts();
  const [state, setState] = useState<SeoAnalyticsState>(defaultSeoAnalyticsState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(getSeoAnalytics());
    setMounted(true);
    const fn = () => setState(getSeoAnalytics());
    window.addEventListener("lc-seo-analytics", fn);
    return () => window.removeEventListener("lc-seo-analytics", fn);
  }, []);

  const persist = (next: SeoAnalyticsState) => {
    setState(next);
    saveSeoAnalytics(next);
  };

  const conversionPct = useMemo(() => {
    const v = state.visitorsDemo || 1;
    return ((state.purchasesDemo / v) * 100).toFixed(2);
  }, [state.visitorsDemo, state.purchasesDemo]);

  const mvlp = useMemo(() => getMostViewedLeastPurchased(), []);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        {t("seoTitle")}…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("seoTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("seoSubtitle")}</p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
            <Percent className="h-4 w-4" />
            {t("kpiConversion")}
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
            {conversionPct}%
          </p>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            {t("kpiConversionHint")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <BarChart3 className="h-4 w-4" />
            {t("kpiVisitors")}
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {state.visitorsDemo.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <ShoppingCart className="h-4 w-4" />
            {t("kpiPurchases")}
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {state.purchasesDemo.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Category SEO + snippet */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Globe className="h-5 w-5 text-[#0066ff]" />
          {t("metaPerCategory")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("seoSnippetHint")}</p>
        <div className="mt-4 space-y-6">
          {categories.slice(0, 4).map((c) => {
            const entry = state.categorySeo[c.slug] ?? {
              title: "",
              desc: "",
            };
            const score = computeSeoScore(entry.title, entry.desc);
            const demoUrl = `https://libas.demo/${c.slug}`;
            return (
              <div
                key={c.id}
                className="grid gap-4 border-b border-slate-100 pb-6 last:border-0 dark:border-slate-800 lg:grid-cols-2"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {c.slug}
                  </p>
                  <label className="mt-1 block text-xs font-bold text-slate-500">
                    {t("metaTitle")}
                    <input
                      value={entry.title}
                      onChange={(e) =>
                        persist({
                          ...state,
                          categorySeo: {
                            ...state.categorySeo,
                            [c.slug]: { ...entry, title: e.target.value },
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                    />
                  </label>
                  <label className="mt-2 block text-xs font-bold text-slate-500">
                    {t("metaDesc")}
                    <textarea
                      rows={2}
                      value={entry.desc}
                      onChange={(e) =>
                        persist({
                          ...state,
                          categorySeo: {
                            ...state.categorySeo,
                            [c.slug]: { ...entry, desc: e.target.value },
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                    />
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        score.label === "good"
                          ? "bg-emerald-500"
                          : score.label === "warn"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {t("seoScoreLabel")}: {score.score}/100
                    </span>
                  </div>
                  {score.hints.map((h) => (
                    <p key={h} className="text-[11px] text-amber-700 dark:text-amber-400">
                      · {t(`seoHint_${h}` as "seoHint_title_short")}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">
                    {t("googlePreview")}
                  </p>
                  <GoogleSnippetPreview
                    title={entry.title}
                    url={demoUrl}
                    description={entry.desc}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sitemap + bulk + redirects + pixels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Download className="h-5 w-5 text-violet-600" />
            {t("sitemapTitle")}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t("sitemapHint")}</p>
          <button
            type="button"
            onClick={() => {
              const origin =
                typeof window !== "undefined" ? window.location.origin : "";
              downloadSitemapXml(origin);
            }}
            className="mt-4 rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
          >
            {t("sitemapDownload")}
          </button>
          <p className="mt-2 text-xs text-slate-400">{t("sitemapApiHint")}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Target className="h-5 w-5 text-amber-600" />
            {t("bulkSeoTitle")}
          </div>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("bulkStoreName")}
            <input
              value={state.bulkStoreName}
              onChange={(e) =>
                persist({ ...state, bulkStoreName: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("bulkTemplate")}
            <input
              value={state.bulkTemplate}
              onChange={(e) =>
                persist({ ...state, bulkTemplate: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
              placeholder="{name} - Buy Online at {store}"
            />
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("bulkCategory")}
            <select
              id="bulk-cat"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              defaultValue={categories[0]?.slug}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.slug}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              const sel = (
                document.getElementById("bulk-cat") as HTMLSelectElement
              )?.value;
              if (!sel) return;
              const n = applyBulkSeoTemplate(
                sel,
                state.bulkTemplate,
                state.bulkStoreName
              );
              alert(t("bulkApplied", { n }));
            }}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
          >
            {t("bulkApply")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Link2 className="h-5 w-5 text-[#0066ff]" />
          {t("redirectManager")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("redirectHint")}</p>
        <div className="mt-4 space-y-3">
          {state.redirects.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 p-2 dark:border-slate-800"
            >
              <label className="flex-1 text-[10px] font-bold text-slate-500">
                {t("redirectFrom")}
                <input
                  value={r.fromPath}
                  onChange={(e) =>
                    persist({
                      ...state,
                      redirects: state.redirects.map((x) =>
                        x.id === r.id ? { ...x, fromPath: e.target.value } : x
                      ),
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="flex-1 text-[10px] font-bold text-slate-500">
                {t("redirectTo")}
                <input
                  value={r.toPath}
                  onChange={(e) =>
                    persist({
                      ...state,
                      redirects: state.redirects.map((x) =>
                        x.id === r.id ? { ...x, toPath: e.target.value } : x
                      ),
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <button
                type="button"
                className="rounded-lg p-2 text-rose-600"
                onClick={() =>
                  persist({
                    ...state,
                    redirects: state.redirects.filter((x) => x.id !== r.id),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              persist({
                ...state,
                redirects: [
                  ...state.redirects,
                  { id: uid(), fromPath: "/product/", toPath: "/product/p1" },
                ],
              })
            }
            className="text-sm font-bold text-[#0066ff]"
          >
            + {t("redirectAdd")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-extrabold text-slate-900 dark:text-slate-100">
            {t("pixelFacebook")}
          </p>
          <input
            value={state.facebookPixelId}
            onChange={(e) =>
              persist({ ...state, facebookPixelId: e.target.value })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="1234567890"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-extrabold text-slate-900 dark:text-slate-100">
            {t("gtmContainer")}
          </p>
          <input
            value={state.gtmContainerId}
            onChange={(e) =>
              persist({ ...state, gtmContainerId: e.target.value })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="GTM-XXXX"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-900/50">
        <p className="font-extrabold text-slate-900 dark:text-slate-100">
          {t("monthlyReportTitle")}
        </p>
        <p className="mt-1 text-sm text-slate-500">{t("monthlyReportHint")}</p>
        <button
          type="button"
          onClick={() => alert(t("monthlyReportDemo"))}
          className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold dark:border-slate-600 dark:bg-slate-950"
        >
          {t("monthlyReportBtn")}
        </button>
      </div>

      {/* Analytics sections */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <ShoppingCart className="h-5 w-5 text-rose-600" />
          {t("abandonedCartTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("abandonedCartHint")}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {state.abandonedCarts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80"
            >
              <span>
                {a.email} · {a.items} · ₹{a.amount}
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi! Use coupon ${a.coupon} on your cart — Libas`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#25D366]"
              >
                WhatsApp
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Radar className="h-5 w-5 text-violet-600" />
          {t("mvlpTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("mvlpHint")}</p>
        <table className="mt-3 w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="p-2 font-bold">{t("colProduct")}</th>
              <th className="p-2 font-bold">{t("colViews")}</th>
              <th className="p-2 font-bold">{t("colPurchases")}</th>
              <th className="p-2 font-bold">{t("mvlpRatio")}</th>
            </tr>
          </thead>
          <tbody>
            {mvlp.map((row) => (
              <tr
                key={row.product}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="p-2">{row.product}</td>
                <td className="p-2">{row.views}</td>
                <td className="p-2">{row.purchases}</td>
                <td className="p-2 font-mono text-xs">{row.ratio.toFixed(1)}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Search className="h-5 w-5 text-[#0066ff]" />
          {t("searchKeywordsTitle")}
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {state.searchKeywords.map((k) => (
            <li
              key={k.query}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800"
            >
              {k.query} · {k.count}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <MousePointerClick className="h-5 w-5 text-amber-600" />
            {t("heatmapTitle")}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {state.heatmap.map((h) => (
              <li key={h.section} className="flex justify-between gap-2">
                <span>{h.section}</span>
                <span className="font-mono font-bold">{h.clicksPct}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            {t("exitPagesTitle")}
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {state.exitPages.map((e) => (
              <li key={e.url} className="flex justify-between gap-2">
                <span className="font-mono text-xs">{e.url}</span>
                <span>{e.exits}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="font-extrabold text-slate-900 dark:text-slate-100">
          {t("journeyTitle")}
        </p>
        <ul className="mt-3 space-y-2 font-mono text-xs text-slate-600 dark:text-slate-400">
          {state.journey.map((j, i) => (
            <li key={i}>
              {j.from} → {j.to} ({j.count})
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <MousePointerClick className="h-5 w-5 text-violet-600" />
          {t("behaviorTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("behaviorHint")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-2 font-bold">{t("colProduct")}</th>
                <th className="p-2 font-bold">{t("colViews")}</th>
                <th className="p-2 font-bold">{t("colWishlist")}</th>
                <th className="p-2 font-bold">{t("colPurchases")}</th>
              </tr>
            </thead>
            <tbody>
              {wishlistBehaviorDemo.map((row) => (
                <tr
                  key={row.product}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="p-2">{row.product}</td>
                  <td className="p-2">{row.views}</td>
                  <td className="p-2">{row.wishlistAdds}</td>
                  <td className="p-2">{row.purchases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {t("behaviorDemoNote", { n: products.length })}
        </p>
      </div>
    </div>
  );
}
