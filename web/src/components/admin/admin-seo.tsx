"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { categories } from "@/lib/storefront-catalog";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { wishlistBehaviorMetrics } from "@/lib/admin-types";
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
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Download,
  Globe,
  LayoutDashboard,
  LineChart,
  Link2,
  MousePointerClick,
  PenLine,
  Percent,
  Radar,
  Radio,
  Search,
  Server,
  ShoppingCart,
  Sparkles,
  Target,
} from "lucide-react";

type SeoTab = "overview" | "onpage" | "technical" | "tags" | "analytics";

function SeoSectionCard({
  children,
  className,
  accent = "sky",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "sky" | "emerald" | "violet" | "amber";
}) {
  const accents: Record<typeof accent, string> = {
    sky: "border-sky-100/90 bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/60 shadow-sm shadow-sky-100/40 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-none",
    emerald:
      "border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 shadow-sm shadow-emerald-100/30 dark:border-emerald-900/40 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-950",
    violet:
      "border-violet-100/90 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/40 shadow-sm shadow-violet-100/30 dark:border-violet-900/30 dark:from-slate-900 dark:via-violet-950/20 dark:to-slate-950",
    amber:
      "border-amber-100/90 bg-gradient-to-br from-white via-amber-50/35 to-orange-50/40 shadow-sm shadow-amber-100/25 dark:border-amber-900/30 dark:from-slate-900 dark:via-amber-950/15 dark:to-slate-950",
  };
  return (
    <div className={cn("rounded-2xl border p-5 md:p-6", accents[accent], className)}>
      {children}
    </div>
  );
}

export function AdminSeo() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const products = useCatalogProducts();
  const [state, setState] = useState<SeoAnalyticsState>(defaultSeoAnalyticsState);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<SeoTab>("overview");

  const siteOrigin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

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

  const tabItems: {
    id: SeoTab;
    icon: typeof LayoutDashboard;
    label: string;
  }[] = [
    { id: "overview", icon: LayoutDashboard, label: t("seoTabOverview") },
    { id: "onpage", icon: PenLine, label: t("seoTabOnPage") },
    { id: "technical", icon: Server, label: t("seoTabTechnical") },
    { id: "tags", icon: Radio, label: t("seoTabTags") },
    { id: "analytics", icon: LineChart, label: t("seoTabAnalytics") },
  ];

  if (!mounted) {
    return (
      <div className="rounded-3xl border border-sky-100/80 bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/60 p-12 text-center shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#7c3aed] text-white shadow-lg shadow-indigo-300/40 dark:shadow-indigo-950/50">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("seoTitle")}…
          </p>
        </div>
      </div>
    );
  }

  const kpiStrip = (
    <div className="grid gap-4 sm:grid-cols-3">
      <SeoSectionCard accent="emerald" className="!p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
              <Percent className="h-4 w-4" />
              {t("kpiConversion")}
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-emerald-900 dark:text-emerald-50">
              {conversionPct}%
            </p>
            <p className="mt-1 text-[11px] font-medium text-emerald-800/85 dark:text-emerald-300/85">
              {t("kpiConversionHint")}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-700 dark:text-emerald-300">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </SeoSectionCard>
      <SeoSectionCard accent="sky" className="!p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <BarChart3 className="h-4 w-4" />
              {t("kpiVisitors")}
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-slate-50">
              {state.visitorsDemo.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-sky-500/15 p-2 text-sky-700 dark:text-sky-300">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
      </SeoSectionCard>
      <SeoSectionCard accent="violet" className="!p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <ShoppingCart className="h-4 w-4" />
              {t("kpiPurchases")}
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-slate-50">
              {state.purchasesDemo.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-violet-500/15 p-2 text-violet-700 dark:text-violet-300">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </SeoSectionCard>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-sky-100/80 bg-gradient-to-r from-[#0066ff]/[0.12] via-[#7c3aed]/[0.1] to-sky-100/35 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0066ff]">
              {t("seoWorkspaceEyebrow")}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
              {t("seoTitle")}
            </h2>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              {t("seoSubtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-xs font-semibold text-slate-800 shadow-inner backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
            <Globe className="h-5 w-5 text-[#0066ff]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("heroPreviewBaseUrl")}
              </p>
              <p className="mt-0.5 max-w-[220px] truncate font-mono text-[11px] text-slate-700 dark:text-slate-200">
                {siteOrigin || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/75"
        role="tablist"
        aria-label={t("seoTabListAriaLabel")}
      >
        {tabItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
              tab === id
                ? "bg-gradient-to-r from-[#0066ff] to-[#7c3aed] text-white shadow-md shadow-indigo-300/35 dark:shadow-indigo-950/40"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {kpiStrip}
          <div className="grid gap-6 lg:grid-cols-2">
            <SeoSectionCard accent="amber">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                {t("monthlyReportTitle")}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("monthlyReportHint")}
              </p>
              <button
                type="button"
                onClick={() => alert(t("monthlyReportDemo"))}
                className="mt-4 rounded-xl border border-amber-200/80 bg-white/90 px-4 py-2.5 text-sm font-bold text-amber-900 shadow-sm transition hover:bg-amber-50 dark:border-amber-900/50 dark:bg-slate-950 dark:text-amber-100 dark:hover:bg-amber-950/40"
              >
                {t("monthlyReportBtn")}
              </button>
            </SeoSectionCard>
            <SeoSectionCard accent="sky">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
                <Search className="h-5 w-5 text-[#0066ff]" />
                {t("searchKeywordsTitle")}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("seoSnippetHint")}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {state.searchKeywords.slice(0, 8).map((k) => (
                  <li
                    key={k.query}
                    className="rounded-full border border-sky-100/90 bg-sky-50/80 px-3 py-1 text-xs font-bold text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100"
                  >
                    {k.query} · {k.count}
                  </li>
                ))}
              </ul>
            </SeoSectionCard>
          </div>
        </div>
      )}

      {tab === "onpage" && (
        <div className="space-y-6">
          <SeoSectionCard>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
                  <Globe className="h-5 w-5 text-[#0066ff]" />
                  {t("metaPerCategory")}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t("seoSnippetHint")}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-6">
              {categories.slice(0, 4).map((c) => {
                const entry = state.categorySeo[c.slug] ?? {
                  title: "",
                  desc: "",
                };
                const score = computeSeoScore(entry.title, entry.desc);
                const demoUrl = siteOrigin
                  ? `${siteOrigin}/${locale}/category/${c.slug}`
                  : `/${locale}/category/${c.slug}`;
                return (
                  <div
                    key={c.id}
                    className="grid gap-5 border-b border-slate-100/90 pb-6 last:border-0 dark:border-slate-800 lg:grid-cols-2"
                  >
                    <div className="rounded-2xl border border-slate-100/90 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        {c.slug}
                      </p>
                      <label className="mt-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
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
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                      <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">
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
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex h-2.5 w-2.5 rounded-full",
                            score.label === "good"
                              ? "bg-emerald-500"
                              : score.label === "warn"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          )}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t("seoScoreLabel")}: {score.score}/100
                        </span>
                      </div>
                      {score.hints.map((h) => (
                        <p
                          key={h}
                          className="text-[11px] font-medium text-amber-800 dark:text-amber-300/90"
                        >
                          · {t(`seoHint_${h}` as "seoHint_title_short")}
                        </p>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-slate-100/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/35">
                      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
          </SeoSectionCard>

          <SeoSectionCard accent="amber">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <Target className="h-5 w-5 text-amber-600" />
              {t("bulkSeoTitle")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("bulkTemplate")}
            </p>
            <label className="mt-4 block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("bulkStoreName")}
              <input
                value={state.bulkStoreName}
                onChange={(e) => persist({ ...state, bulkStoreName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("bulkTemplate")}
              <input
                value={state.bulkTemplate}
                onChange={(e) => persist({ ...state, bulkTemplate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder={t("bulkTemplatePlaceholder")}
              />
            </label>
            <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("bulkCategory")}
              <select
                id="bulk-cat"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
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
                const sel = (document.getElementById("bulk-cat") as HTMLSelectElement)?.value;
                if (!sel) return;
                const n = applyBulkSeoTemplate(sel, state.bulkTemplate, state.bulkStoreName);
                alert(t("bulkApplied", { n }));
              }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-md dark:from-white dark:to-slate-200 dark:text-slate-900 sm:w-auto"
            >
              {t("bulkApply")}
            </button>
          </SeoSectionCard>
        </div>
      )}

      {tab === "technical" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SeoSectionCard accent="violet">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <Download className="h-5 w-5 text-violet-600" />
              {t("sitemapTitle")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("sitemapHint")}</p>
            <button
              type="button"
              onClick={() => {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                downloadSitemapXml(origin);
              }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#0066ff] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-md sm:w-auto"
            >
              {t("sitemapDownload")}
            </button>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t("sitemapApiHint")}</p>
          </SeoSectionCard>

          <SeoSectionCard>
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <Link2 className="h-5 w-5 text-[#0066ff]" />
              {t("redirectManager")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("redirectHint")}</p>
            <div className="mt-4 space-y-3">
              {state.redirects.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <label className="min-w-[140px] flex-1 text-[10px] font-bold uppercase text-slate-500">
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
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="min-w-[140px] flex-1 text-[10px] font-bold uppercase text-slate-500">
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
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                className="text-sm font-bold text-[#0066ff] hover:underline"
              >
                + {t("redirectAdd")}
              </button>
            </div>
          </SeoSectionCard>
        </div>
      )}

      {tab === "tags" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SeoSectionCard accent="sky">
            <p className="font-extrabold text-slate-900 dark:text-slate-100">{t("pixelFacebook")}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("pixelFacebookHint")}
            </p>
            <input
              value={state.facebookPixelId}
              onChange={(e) => persist({ ...state, facebookPixelId: e.target.value })}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="1234567890"
            />
          </SeoSectionCard>
          <SeoSectionCard accent="violet">
            <p className="font-extrabold text-slate-900 dark:text-slate-100">{t("gtmContainer")}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("gtmContainerHint")}
            </p>
            <input
              value={state.gtmContainerId}
              onChange={(e) => persist({ ...state, gtmContainerId: e.target.value })}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="GTM-XXXX"
            />
          </SeoSectionCard>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-6">
          <SeoSectionCard>
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <ShoppingCart className="h-5 w-5 text-rose-600" />
              {t("abandonedCartTitle")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("abandonedCartHint")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {state.abandonedCarts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-100/80 bg-rose-50/50 px-3 py-2.5 dark:border-rose-900/40 dark:bg-rose-950/25"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {a.email} · {a.items} · ₹{a.amount}
                  </span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      t("abandonedCartWhatsappMsg", { coupon: a.coupon })
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#25D366]"
                  >
                    {t("abandonedCartWhatsapp")}
                  </a>
                </li>
              ))}
            </ul>
          </SeoSectionCard>

          <SeoSectionCard accent="violet">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <Radar className="h-5 w-5 text-violet-600" />
              {t("mvlpTitle")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("mvlpHint")}</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/80">
                    <th className="p-3 font-bold">{t("colProduct")}</th>
                    <th className="p-3 font-bold">{t("colViews")}</th>
                    <th className="p-3 font-bold">{t("colPurchases")}</th>
                    <th className="p-3 font-bold">{t("mvlpRatio")}</th>
                  </tr>
                </thead>
                <tbody>
                  {mvlp.map((row) => (
                    <tr key={row.product} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3">{row.product}</td>
                      <td className="p-3">{row.views}</td>
                      <td className="p-3">{row.purchases}</td>
                      <td className="p-3 font-mono text-xs">{row.ratio.toFixed(1)}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SeoSectionCard>

          <SeoSectionCard>
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <Search className="h-5 w-5 text-[#0066ff]" />
              {t("searchKeywordsTitle")}
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {state.searchKeywords.map((k) => (
                <li
                  key={k.query}
                  className="rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-bold text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/35 dark:text-sky-100"
                >
                  {k.query} · {k.count}
                </li>
              ))}
            </ul>
          </SeoSectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SeoSectionCard accent="amber">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
                <MousePointerClick className="h-5 w-5 text-amber-600" />
                {t("heatmapTitle")}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {state.heatmap.map((h) => (
                  <li
                    key={h.section}
                    className="flex justify-between gap-2 rounded-lg border border-amber-100/80 bg-amber-50/40 px-3 py-2 dark:border-amber-900/30 dark:bg-amber-950/20"
                  >
                    <span>{h.section}</span>
                    <span className="font-mono font-bold">{h.clicksPct}%</span>
                  </li>
                ))}
              </ul>
            </SeoSectionCard>
            <SeoSectionCard accent="emerald">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                {t("exitPagesTitle")}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {state.exitPages.map((e) => (
                  <li
                    key={e.url}
                    className="flex justify-between gap-2 rounded-lg border border-emerald-100/80 bg-emerald-50/35 px-3 py-2 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                  >
                    <span className="font-mono text-xs">{e.url}</span>
                    <span className="font-bold">{e.exits}</span>
                  </li>
                ))}
              </ul>
            </SeoSectionCard>
          </div>

          <SeoSectionCard>
            <p className="font-extrabold text-slate-900 dark:text-slate-100">{t("journeyTitle")}</p>
            <ul className="mt-4 space-y-2 font-mono text-xs text-slate-600 dark:text-slate-400">
              {state.journey.map((j, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  {j.from} → {j.to} ({j.count})
                </li>
              ))}
            </ul>
          </SeoSectionCard>

          <SeoSectionCard accent="violet">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <MousePointerClick className="h-5 w-5 text-violet-600" />
              {t("behaviorTitle")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("behaviorHint")}</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/80">
                    <th className="p-3 font-bold">{t("colProduct")}</th>
                    <th className="p-3 font-bold">{t("colViews")}</th>
                    <th className="p-3 font-bold">{t("colWishlist")}</th>
                    <th className="p-3 font-bold">{t("colPurchases")}</th>
                  </tr>
                </thead>
                <tbody>
                  {wishlistBehaviorMetrics.map((row) => (
                    <tr key={row.product} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3">{row.product}</td>
                      <td className="p-3">{row.views}</td>
                      <td className="p-3">{row.wishlistAdds}</td>
                      <td className="p-3">{row.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t("behaviorDemoNote", { n: products.length })}
            </p>
          </SeoSectionCard>
        </div>
      )}
    </div>
  );
}
