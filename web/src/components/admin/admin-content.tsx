"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { categories } from "@/lib/storefront-catalog";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import {
  Bell,
  GripVertical,
  ImageIcon,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  PanelsTopLeft,
  Plus,
  Smartphone,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import {
  defaultCmsState,
  getCms,
  parseSectionKey,
  resolveBannerHref,
  saveCms,
  uid,
  type BannerHrefType,
  type CmsBannerSlide,
  type CmsCustomSection,
  type CmsState,
  type HomeSectionKey,
} from "@/lib/cms-storage";
import { ensureMisleadingDemoAllowed } from "@/lib/deploy-safety";

function hrefForLinkType(
  nextType: BannerHrefType,
  prevHref: string,
  productIds: string[],
  categorySlugs: string[]
): string {
  if (nextType === "product") {
    if (productIds.includes(prevHref)) return prevHref;
    return productIds[0] ?? prevHref;
  }
  if (nextType === "category") {
    if (categorySlugs.includes(prevHref)) return prevHref;
    return categorySlugs[0] ?? "mens-wear";
  }
  const t = prevHref.trim();
  if (!t) return "/sale";
  return t.startsWith("/") ? t : `/${t}`;
}

export function AdminContent() {
  const t = useTranslations("admin");
  const tHome = useTranslations("home");
  const products = useCatalogProducts();
  const [cms, setCms] = useState<CmsState>(defaultCmsState);
  const [mounted, setMounted] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [previewBannerId, setPreviewBannerId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setCms(getCms());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  /** Catalog loads after first paint — fix product link targets that were invalid while the list was empty. */
  useEffect(() => {
    if (!mounted || products.length === 0) return;
    const productIds = products.map((p) => p.id);
    const categorySlugs = categories.map((c) => c.slug);
    setCms((prev) => {
      let changed = false;
      const banners = prev.banners.map((b) => {
        if (b.hrefType === "product" && !productIds.includes(b.href)) {
          changed = true;
          return { ...b, href: productIds[0]! };
        }
        if (b.hrefType === "category" && !categorySlugs.includes(b.href)) {
          changed = true;
          return { ...b, href: categorySlugs[0] ?? b.href };
        }
        return b;
      });
      if (!changed) return prev;
      const next = { ...prev, banners };
      saveCms(next);
      return next;
    });
  }, [mounted, products]);

  const builtinSectionTitle = (key: HomeSectionKey) => {
    const titles: Record<HomeSectionKey, string> = {
      categories: tHome("shopByCategory"),
      featured: tHome("featuredProducts"),
      continue: tHome("continueShopping"),
      instagram: tHome("instagramTitle"),
    };
    return titles[key];
  };

  function sectionOrderLabel(raw: string): string {
    const p = parseSectionKey(raw);
    if (!p) return raw;
    if (p.type === "custom") return t("cmsCustomSection");
    return builtinSectionTitle(p.key);
  }

  const previewSlide = useMemo(() => {
    const b = cms.banners.find((x) => x.id === previewBannerId) ?? cms.banners[0];
    return b ?? null;
  }, [cms.banners, previewBannerId]);

  const mobilePreviewSrc =
    previewSlide?.mobileUrl?.trim() || previewSlide?.desktopUrl?.trim() || "";

  function persist(next: CmsState) {
    setCms(next);
    saveCms(next);
  }

  function saveAll() {
    saveCms(cms);
    setToast(t("cmsToastSaved"));
  }

  function updateBanner(id: string, patch: Partial<CmsBannerSlide>) {
    persist({
      ...cms,
      banners: cms.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }

  function addBanner() {
    const id = uid();
    persist({
      ...cms,
      banners: [
        ...cms.banners,
        {
          id,
          active: true,
          desktopUrl: "",
          mobileUrl: "",
          hrefType: "category",
          href: categories[0]?.slug ?? "mens-wear",
          expiresAt: null,
          sortOrder: cms.banners.length,
        },
      ],
    });
    setPreviewBannerId(id);
  }

  function removeBanner(id: string) {
    persist({
      ...cms,
      banners: cms.banners.filter((b) => b.id !== id),
    });
  }

  function onSectionDragStart(key: string) {
    setDragKey(key);
  }

  function onSectionDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) {
      setDragKey(null);
      return;
    }
    const order = [...cms.sectionOrder];
    const from = order.indexOf(dragKey);
    const to = order.indexOf(targetKey);
    if (from < 0 || to < 0) {
      setDragKey(null);
      return;
    }
    order.splice(from, 1);
    order.splice(to, 0, dragKey);
    persist({ ...cms, sectionOrder: order });
    setDragKey(null);
  }

  function addCustomSection() {
    const id = uid();
    const sec: CmsCustomSection = {
      id,
      title: t("cmsCustomDefaultTitle"),
      productIds: products.slice(0, 4).map((p) => p.id),
      limit: 8,
    };
    persist({
      ...cms,
      customSections: [...cms.customSections, sec],
      sectionOrder: [...cms.sectionOrder, `custom:${id}`],
    });
  }

  function updateCustomSection(id: string, patch: Partial<CmsCustomSection>) {
    persist({
      ...cms,
      customSections: cms.customSections.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  }

  function removeCustomSection(id: string) {
    persist({
      ...cms,
      customSections: cms.customSections.filter((c) => c.id !== id),
      sectionOrder: cms.sectionOrder.filter((k) => k !== `custom:${id}`),
    });
  }

  function toggleProductInSection(secId: string, productId: string) {
    const sec = cms.customSections.find((c) => c.id === secId);
    if (!sec) return;
    const set = new Set(sec.productIds);
    if (set.has(productId)) set.delete(productId);
    else if (set.size < 12) set.add(productId);
    updateCustomSection(secId, { productIds: [...set] });
  }

  function sendDemoNotification() {
    if (!ensureMisleadingDemoAllowed()) return;
    const bump = {
      sent: cms.notificationStats.sent + 420,
      opened: cms.notificationStats.opened + 180,
      clicks: cms.notificationStats.clicks + 48,
    };
    persist({ ...cms, notificationStats: bump });
  }

  const campaignHref = resolveBannerHref({
    id: "prev",
    active: true,
    desktopUrl: "",
    mobileUrl: "",
    hrefType: cms.notificationCampaign.hrefType,
    href: cms.notificationCampaign.href,
    expiresAt: null,
    sortOrder: 0,
  });

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        {t("contentTitle")}…
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[100] max-w-md rounded-xl border border-emerald-500/30 bg-emerald-950 px-4 py-3 text-sm font-semibold text-emerald-50 shadow-xl dark:bg-emerald-950/95"
        >
          {toast}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-indigo-100/80 bg-gradient-to-r from-[#0066ff]/[0.12] via-violet-500/[0.08] to-sky-100/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] to-violet-600 text-white shadow-lg shadow-indigo-300/30 dark:shadow-indigo-950/40">
              <PanelsTopLeft className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0066ff]">
                {t("cmsHeroEyebrow")}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {t("contentTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("contentSubtitle")}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("cmsHeroHint")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={saveAll}
            className="shrink-0 rounded-xl bg-[#0066ff] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0052cc]"
          >
            {t("cmsSaveAll")}
          </button>
        </div>
      </div>

      {/* Banners */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <ImageIcon className="h-5 w-5 text-[#0066ff]" />
            {t("bannerTitle")}
          </div>
          <button
            type="button"
            onClick={addBanner}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold dark:border-slate-600"
          >
            <Plus className="h-4 w-4" />
            {t("cmsAddSlide")}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("cmsBannerIntro")}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(140px,200px)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-600">
                  <th className="pb-2 pr-2">{t("cmsColActive")}</th>
                  <th className="pb-2 pr-2">{t("cmsDesktopUrl")}</th>
                  <th className="pb-2 pr-2">{t("cmsMobileUrl")}</th>
                  <th className="pb-2 pr-2">{t("cmsHrefType")}</th>
                  <th className="pb-2 pr-2">{t("cmsHrefValue")}</th>
                  <th className="pb-2 pr-2">{t("cmsExpires")}</th>
                  <th className="pb-2 pr-2">{t("cmsSort")}</th>
                  <th className="pb-2">{t("cmsColPreview")}</th>
                </tr>
              </thead>
              <tbody>
                {cms.banners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center align-middle text-sm text-slate-500"
                    >
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("cmsBannerEmptyTitle")}
                      </p>
                      <p className="mt-1 max-w-md mx-auto text-xs">
                        {t("cmsBannerEmptyHint")}
                      </p>
                    </td>
                  </tr>
                ) : null}
                {cms.banners.map((b) => (
                  <tr key={b.id} className="align-top border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={b.active}
                        onChange={(e) =>
                          updateBanner(b.id, { active: e.target.checked })
                        }
                        aria-label={t("cmsColActive")}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={b.desktopUrl}
                        onChange={(e) =>
                          updateBanner(b.id, { desktopUrl: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 font-mono dark:border-slate-600 dark:bg-slate-950"
                        placeholder="https://…"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={b.mobileUrl}
                        onChange={(e) =>
                          updateBanner(b.id, { mobileUrl: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 font-mono dark:border-slate-600 dark:bg-slate-950"
                        placeholder="https://…"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={b.hrefType}
                        onChange={(e) => {
                          const hrefType = e.target.value as BannerHrefType;
                          const href = hrefForLinkType(
                            hrefType,
                            b.href,
                            products.map((p) => p.id),
                            categories.map((c) => c.slug)
                          );
                          updateBanner(b.id, { hrefType, href });
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
                      >
                        <option value="product">{t("cmsHrefProduct")}</option>
                        <option value="category">{t("cmsHrefCategory")}</option>
                        <option value="custom">{t("cmsHrefCustom")}</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      {b.hrefType === "product" ? (
                        <select
                          value={
                            products.some((p) => p.id === b.href)
                              ? b.href
                              : products[0]?.id ?? ""
                          }
                          onChange={(e) =>
                            updateBanner(b.id, { href: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
                          disabled={products.length === 0}
                        >
                          {products.length === 0 ? (
                            <option value="">{t("cmsCatalogLoading")}</option>
                          ) : (
                            products.slice(0, 40).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title.slice(0, 40)}
                              </option>
                            ))
                          )}
                        </select>
                      ) : b.hrefType === "category" ? (
                        <select
                          value={b.href}
                          onChange={(e) =>
                            updateBanner(b.id, { href: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.slug}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={b.href}
                          onChange={(e) =>
                            updateBanner(b.id, { href: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
                          placeholder="/sale"
                        />
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="datetime-local"
                        value={
                          b.expiresAt
                            ? b.expiresAt.slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          updateBanner(b.id, {
                            expiresAt: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-1 py-1 dark:border-slate-600 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={b.sortOrder}
                        onChange={(e) =>
                          updateBanner(b.id, {
                            sortOrder: Number(e.target.value) || 0,
                          })
                        }
                        className="w-14 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => setPreviewBannerId(b.id)}
                        className="text-[#0066ff] hover:underline"
                      >
                        {t("cmsPickPreview")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBanner(b.id)}
                        className="ml-2 text-rose-600"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="inline h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
              <Smartphone className="h-3.5 w-3.5" />
              {t("cmsPreviewMobile")}
            </div>
            <div className="relative h-[220px] w-[110px] overflow-hidden rounded-[1.5rem] border-4 border-slate-800 bg-slate-900 shadow-xl">
              <div className="absolute left-1/2 top-2 h-4 w-12 -translate-x-1/2 rounded-full bg-slate-800" />
              {mobilePreviewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mobilePreviewSrc}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-slate-500">
                  {t("cmsPreviewEmpty")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section order */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <LayoutGrid className="h-5 w-5 text-violet-600" />
          {t("sectionOrderTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("cmsSectionOrderHint")}</p>
        <ul className="mt-4 space-y-2">
          {cms.sectionOrder.map((key) => {
            const custom = key.startsWith("custom:")
              ? cms.customSections.find((c) => c.id === key.slice(7))
              : undefined;
            const label =
              custom != null
                ? `${t("cmsCustomSection")}: ${custom.title}`
                : sectionOrderLabel(key);
            return (
              <li
                key={key}
                draggable
                onDragStart={() => onSectionDragStart(key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onSectionDrop(key)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-sm font-semibold">{label}</span>
                <span className="ml-auto font-mono text-[10px] text-slate-400">
                  {key}
                </span>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={addCustomSection}
          className="mt-4 inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-600"
        >
          <Plus className="h-4 w-4" />
          {t("cmsAddCustomSection")}
        </button>
      </div>

      {/* Custom collections detail */}
      {cms.customSections.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100">
            {t("cmsCustomCollections")}
          </h3>
          <div className="mt-4 space-y-8">
            {cms.customSections.map((sec) => (
              <div
                key={sec.id}
                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex flex-wrap gap-3">
                  <label className="block flex-1 min-w-[200px] text-xs font-bold text-slate-500">
                    {t("cmsCustomTitle")}
                    <input
                      value={sec.title}
                      onChange={(e) =>
                        updateCustomSection(sec.id, { title: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                    />
                  </label>
                  <label className="block w-28 text-xs font-bold text-slate-500">
                    {t("cmsProductLimit")}
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={sec.limit}
                      onChange={(e) =>
                        updateCustomSection(sec.id, {
                          limit: Number(e.target.value) || 4,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCustomSection(sec.id)}
                    className="self-end rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 dark:border-rose-900"
                  >
                    {t("delete")}
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">{t("cmsPickProducts")}</p>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-600">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {products.slice(0, 48).map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={sec.productIds.includes(p.id)}
                          onChange={() => toggleProductInSection(sec.id, p.id)}
                        />
                        <span className="truncate">{p.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Flash sale */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Zap className="h-5 w-5 text-amber-500" />
          {t("cmsFlashTitle")}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={cms.flashSale.enabled}
            onChange={(e) =>
              persist({
                ...cms,
                flashSale: { ...cms.flashSale, enabled: e.target.checked },
              })
            }
          />
          {t("cmsFlashEnabled")}
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-500">
            {t("cmsFlashLabel")}
            <input
              value={cms.flashSale.label}
              onChange={(e) =>
                persist({
                  ...cms,
                  flashSale: { ...cms.flashSale, label: e.target.value },
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("cmsFlashEnd")}
            <input
              type="datetime-local"
              value={cms.flashSale.endAt.slice(0, 16)}
              onChange={(e) =>
                persist({
                  ...cms,
                  flashSale: {
                    ...cms.flashSale,
                    endAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : cms.flashSale.endAt,
                  },
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
        </div>
      </div>

      {/* Announcement + Popup */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Megaphone className="h-5 w-5 text-[#0066ff]" />
            {t("cmsAnnouncementBar")}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={cms.announcement.active}
              onChange={(e) =>
                persist({
                  ...cms,
                  announcement: {
                    ...cms.announcement,
                    active: e.target.checked,
                  },
                })
              }
            />
            {t("cmsAnnouncementOn")}
          </label>
          <textarea
            value={cms.announcement.text}
            onChange={(e) =>
              persist({
                ...cms,
                announcement: { ...cms.announcement, text: e.target.value },
              })
            }
            rows={3}
            className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Sparkles className="h-5 w-5 text-violet-500" />
            {t("cmsPopupTitle")}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={cms.popup.enabled}
              onChange={(e) =>
                persist({
                  ...cms,
                  popup: { ...cms.popup, enabled: e.target.checked },
                })
              }
            />
            {t("cmsPopupOn")}
          </label>
          <input
            value={cms.popup.title}
            onChange={(e) =>
              persist({
                ...cms,
                popup: { ...cms.popup, title: e.target.value },
              })
            }
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder={t("cmsPopupTitle")}
          />
          <textarea
            value={cms.popup.body}
            onChange={(e) =>
              persist({
                ...cms,
                popup: { ...cms.popup, body: e.target.value },
              })
            }
            rows={2}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              value={cms.popup.couponCode}
              onChange={(e) =>
                persist({
                  ...cms,
                  popup: { ...cms.popup, couponCode: e.target.value },
                })
              }
              className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
              placeholder="COUPON"
            />
            <input
              value={cms.popup.imageUrl}
              onChange={(e) =>
                persist({
                  ...cms,
                  popup: { ...cms.popup, imageUrl: e.target.value },
                })
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              placeholder="https://…"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100">
          {t("cmsSeoGlobal")}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{t("cmsSeoHint")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-500">
            {t("metaTitle")}
            <input
              value={cms.seo.metaTitle}
              onChange={(e) =>
                persist({
                  ...cms,
                  seo: { ...cms.seo, metaTitle: e.target.value },
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("metaDesc")}
            <textarea
              value={cms.seo.metaDesc}
              onChange={(e) =>
                persist({
                  ...cms,
                  seo: { ...cms.seo, metaDesc: e.target.value },
                })
              }
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            Favicon URL
            <input
              value={cms.seo.faviconUrl}
              onChange={(e) =>
                persist({
                  ...cms,
                  seo: { ...cms.seo, faviconUrl: e.target.value },
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            OG image URL
            <input
              value={cms.seo.ogImageUrl}
              onChange={(e) =>
                persist({
                  ...cms,
                  seo: { ...cms.seo, ogImageUrl: e.target.value },
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Bell className="h-5 w-5 text-violet-600" />
          {t("notifSender")}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-slate-500">{t("cmsAudience")}</p>
            <select
              value={cms.notificationAudience}
              onChange={(e) =>
                persist({
                  ...cms,
                  notificationAudience: e.target.value as CmsState["notificationAudience"],
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="all">{t("cmsAudienceAll")}</option>
              <option value="inactive_30d">{t("cmsAudienceInactive")}</option>
              <option value="high_value">{t("cmsAudienceHigh")}</option>
            </select>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
              <p className="font-bold text-slate-600 dark:text-slate-400">
                {t("cmsNotifStats")}
              </p>
              <p>
                {t("cmsStatSent")}: {cms.notificationStats.sent} ·{" "}
                {t("cmsStatOpened")}: {cms.notificationStats.opened} ·{" "}
                {t("cmsStatClicks")}: {cms.notificationStats.clicks}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500">{t("cmsRichNotif")}</p>
            <input
              value={cms.notificationCampaign.title}
              onChange={(e) =>
                persist({
                  ...cms,
                  notificationCampaign: {
                    ...cms.notificationCampaign,
                    title: e.target.value,
                  },
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
              placeholder="Title"
            />
            <textarea
              value={cms.notificationCampaign.body}
              onChange={(e) =>
                persist({
                  ...cms,
                  notificationCampaign: {
                    ...cms.notificationCampaign,
                    body: e.target.value,
                  },
                })
              }
              rows={2}
              className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <input
              value={cms.notificationCampaign.imageUrl}
              onChange={(e) =>
                persist({
                  ...cms,
                  notificationCampaign: {
                    ...cms.notificationCampaign,
                    imageUrl: e.target.value,
                  },
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-950"
              placeholder="Image URL"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={cms.notificationCampaign.ctaLabel}
                onChange={(e) =>
                  persist({
                    ...cms,
                    notificationCampaign: {
                      ...cms.notificationCampaign,
                      ctaLabel: e.target.value,
                    },
                  })
                }
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
              />
              <select
                value={cms.notificationCampaign.hrefType}
                onChange={(e) =>
                  persist({
                    ...cms,
                    notificationCampaign: {
                      ...cms.notificationCampaign,
                      hrefType: e.target.value as BannerHrefType,
                    },
                  })
                }
                className="rounded-lg border border-slate-200 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-950"
              >
                <option value="product">{t("cmsHrefProduct")}</option>
                <option value="category">{t("cmsHrefCategory")}</option>
                <option value="custom">{t("cmsHrefCustom")}</option>
              </select>
            </div>
            <input
              value={cms.notificationCampaign.href}
              onChange={(e) =>
                persist({
                  ...cms,
                  notificationCampaign: {
                    ...cms.notificationCampaign,
                    href: e.target.value,
                  },
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
            />
            <p className="mt-2 text-[10px] text-slate-400">
              → {campaignHref}
            </p>
            {cms.notificationCampaign.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cms.notificationCampaign.imageUrl}
                alt=""
                className="mt-2 h-20 w-full rounded-lg object-cover"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={sendDemoNotification}
            className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
          >
            {t("cmsSendSegment")}
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          {t("cmsWhatsAppTemplates")}
        </div>
        <p className="mt-1 text-xs text-slate-500">{t("cmsWhatsAppHint")}</p>
        <label className="mt-3 block text-xs font-bold text-slate-500">
          {t("cmsTplConfirm")}
          <textarea
            value={cms.whatsappTemplates.orderConfirm}
            onChange={(e) =>
              persist({
                ...cms,
                whatsappTemplates: {
                  ...cms.whatsappTemplates,
                  orderConfirm: e.target.value,
                },
              })
            }
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-500">
          {t("cmsTplShipped")}
          <textarea
            value={cms.whatsappTemplates.orderShipped}
            onChange={(e) =>
              persist({
                ...cms,
                whatsappTemplates: {
                  ...cms.whatsappTemplates,
                  orderShipped: e.target.value,
                },
              })
            }
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-6 dark:border-slate-700">
        <button
          type="button"
          onClick={saveAll}
          className="rounded-xl bg-[#0066ff] px-6 py-2.5 text-sm font-bold text-white"
        >
          {t("cmsSaveAll")}
        </button>
      </div>
    </div>
  );
}
