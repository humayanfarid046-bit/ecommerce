"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { useTranslations } from "next-intl";
import { categories, getProductById } from "@/lib/storefront-catalog";
import type { Product } from "@/lib/product-model";
import {
  getProductMeta,
  setProductMeta,
  slugifyName,
} from "@/lib/product-admin-meta";
import {
  CATALOG_SAVE_STATUS_EVENT,
  newCatalogProductId,
  upsertCatalogProduct,
} from "@/lib/catalog-products-storage";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageDropCrop, type GalleryItem } from "@/components/admin/image-drop-crop";
import {
  VariantMatrix,
  type VariantRow,
} from "@/components/admin/variant-matrix";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { GoogleSnippetPreview } from "@/components/google-snippet-preview";
import { computeSeoScore } from "@/lib/seo-analytics-storage";

/** Rebuild variant rows from saved catalogue data so edit/duplicate does not reset stock to defaults. */
function variantsFromProduct(p: import("@/lib/product-model").Product): VariantRow[] {
  const stock =
    typeof p.stockLeft === "number" ? p.stockLeft : p.inStock ? 10 : 0;
  const sizes = p.sizeOptions?.length ? p.sizeOptions : ["One size"];
  const colorLabels = p.colorOptions?.length
    ? p.colorOptions.map((c) => c.label)
    : ["Default"];
  const pairs: { size: string; color: string }[] = [];
  for (const s of sizes) {
    for (const c of colorLabels) {
      pairs.push({ size: s, color: c });
    }
  }
  const n = Math.max(1, pairs.length);
  const base = Math.floor(stock / n);
  const extra = stock - base * n;
  return pairs.map((pair, i) => {
    const rowStock = base + (i < extra ? 1 : 0);
    return {
      id: `v-${p.id}-${i}`,
      size: pair.size,
      color: pair.color,
      sku: `${(p.slug || "sku").toUpperCase().replace(/\s+/g, "-").slice(0, 28)}-${i}`,
      price: p.price,
      stock: rowStock,
      weightG: 280,
    };
  });
}

type Img = GalleryItem;
const MIN_UPLOAD_IMAGE_SIDE = 1000;
const MIN_CHECKLIST_IMAGES = 3;

type Props = {
  editProductId: string | null;
  duplicateFromId: string | null;
  onClearDuplicate: () => void;
};

export function ProductWizard({
  editProductId,
  duplicateFromId,
  onClearDuplicate,
}: Props) {
  const t = useTranslations("admin");
  const tc = useTranslations("categories");

  const [step, setStep] = useState(1);
  const catalog = useCatalogProducts();
  const [targetId, setTargetId] = useState(() => newCatalogProductId());
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("mens-wear");
  const [subSlug, setSubSlug] = useState("");
  const [descHtml, setDescHtml] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [images, setImages] = useState<Img[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const [flashH, setFlashH] = useState("2");
  const [flashPct, setFlashPct] = useState("12");
  const [toast, setToast] = useState<string | null>(null);
  /** Hex for PDP gallery frame behind photos (optional) */
  const [galleryBg, setGalleryBg] = useState("");
  const [imageSizeOk, setImageSizeOk] = useState<Record<string, boolean>>({});

  const priceDemo = getProductById(targetId)?.price ?? 1999;

  useEffect(() => {
    setSlug(slugifyName(name));
  }, [name]);

  useEffect(() => {
    if (!toast) return;
    const tid = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(tid);
  }, [toast]);

  useEffect(() => {
    const onSaveStatus = (evt: Event) => {
      const ce = evt as CustomEvent<{ status?: string; message?: string }>;
      const status = ce.detail?.status;
      const detailMsg = ce.detail?.message?.trim();
      if (status === "local_saved") {
        setToast("Saved locally. Syncing cloud...");
        return;
      }
      if (status === "local_saved_compact") {
        setToast("Saved locally (optimized). Syncing cloud...");
        return;
      }
      if (status === "local_failed") {
        setToast("Save failed locally. Please reduce images and try again.");
        return;
      }
      if (status === "cloud_synced") {
        setToast("Cloud sync complete.");
        return;
      }
      if (status === "cloud_sync_failed") {
        setToast(
          detailMsg
            ? `Cloud sync failed: ${detailMsg}`
            : "Cloud sync failed. Local save kept."
        );
        return;
      }
      if (status === "cloud_skipped_auth") {
        setToast("Saved locally. Sign in to sync to cloud.");
      }
    };
    window.addEventListener(CATALOG_SAVE_STATUS_EVENT, onSaveStatus);
    return () => {
      window.removeEventListener(CATALOG_SAVE_STATUS_EVENT, onSaveStatus);
    };
  }, []);

  const loadProduct = useCallback(
    (id: string, dup: boolean) => {
      const p = getProductById(id);
      if (!p) return;
      if (dup) {
        setTargetId(newCatalogProductId());
      } else {
        setTargetId(p.id);
      }
      setName(dup ? `${p.title} (copy)` : p.title);
      setSlug(dup ? `${p.slug}-copy` : p.slug);
      setCategorySlug(p.categorySlug);
      setSubSlug("");
      setDescHtml(`<p>${p.description}</p>`);
      const m = getProductMeta(p.id);
      setMetaTitle(m.metaTitle ?? p.title);
      setMetaDesc(m.metaDescription ?? p.description.slice(0, 120));
      const alts = m.imageAlts ?? {};
      setImages(
        p.images.map((src, i) => {
          const imId = `ex-${i}`;
          return {
            id: imId,
            src,
            name: `image-${i}.jpg`,
            alt: alts[imId] ?? "",
          };
        })
      );
      setVariants(variantsFromProduct(p));
      setColorImages({});
      setFlashH("2");
      setFlashPct("12");
      if (m.flashSale?.endsAt && m.flashSale.discountPct) {
        const end = new Date(m.flashSale.endsAt).getTime();
        if (end > Date.now()) {
          const hours = Math.max(1, Math.ceil((end - Date.now()) / 3600000));
          setFlashH(String(Math.min(168, hours)));
          setFlashPct(String(m.flashSale.discountPct));
        }
      }
      setGalleryBg(p.galleryBackground?.trim() ?? "");
    },
    []
  );

  useEffect(() => {
    if (editProductId) loadProduct(editProductId, false);
  }, [editProductId, loadProduct]);

  useEffect(() => {
    if (duplicateFromId) {
      loadProduct(duplicateFromId, true);
      onClearDuplicate();
    }
  }, [duplicateFromId, loadProduct, onClearDuplicate]);

  const subOptions =
    categories.find((c) => c.slug === categorySlug)?.children ?? [];

  function stripHtml(html: string): string {
    if (typeof document === "undefined")
      return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const d = document.createElement("div");
    d.innerHTML = html;
    return (d.textContent || "").trim();
  }

  async function readImageSize(src: string): Promise<{ width: number; height: number } | null> {
    if (typeof window === "undefined") return null;
    return new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve({ width: im.naturalWidth, height: im.naturalHeight });
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, boolean> = {};
      for (const im of images) {
        const dim = await readImageSize(im.src);
        next[im.id] = Boolean(
          dim && dim.width >= MIN_UPLOAD_IMAGE_SIDE && dim.height >= MIN_UPLOAD_IMAGE_SIDE
        );
      }
      if (!cancelled) setImageSizeOk(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [images]);

  const checklist = useMemo(() => {
    const minCountOk = images.length >= MIN_CHECKLIST_IMAGES;
    const resolutionOk = images.length > 0 && images.every((im) => imageSizeOk[im.id] === true);
    const altTexts = images.map((i) => (i.alt ?? "").toLowerCase().trim()).filter(Boolean);
    const colorOk = altTexts.some((a) =>
      /(color|colour|rong|shade|navy|black|blue|red|green|white|cream|pink|yellow|grey)/.test(a)
    );
    const fabricOk = altTexts.some((a) =>
      /(fabric|texture|kapor|cotton|silk|linen|denim|knit|weave|stitch)/.test(a)
    );
    return {
      minCountOk,
      resolutionOk,
      colorOk,
      fabricOk,
      allOk: minCountOk && resolutionOk && colorOk && fabricOk,
    };
  }, [images, imageSizeOk]);

  const saveMeta = async () => {
    const fh = Number(flashH);
    const fp = Number(flashPct);
    const flash =
      fh > 0 && fp > 0
        ? {
            endsAt: new Date(Date.now() + fh * 3600000).toISOString(),
            discountPct: fp,
          }
        : null;
    const imageAlts: Record<string, string> = {};
    images.forEach((im) => {
      const a = im.alt?.trim();
      if (a) imageAlts[im.id] = a;
    });

    const basePrice = variants.length
      ? Math.min(...variants.map((v) => v.price))
      : priceDemo;
    const stockTotal = variants.length
      ? variants.reduce((s, v) => s + v.stock, 0)
      : 10;
    const mrp = Math.round(basePrice * 1.25);
    const discountPct =
      mrp > basePrice ? Math.round(((mrp - basePrice) / mrp) * 100) : 0;
    const uniqSizes = [...new Set(variants.map((v) => v.size))];
    const uniqColors = [...new Set(variants.map((v) => v.color))];
    const descPlain = stripHtml(descHtml) || name.trim() || "Product";
    const imgs = images.map((i) => i.src).filter(Boolean);
    if (imgs.length < MIN_CHECKLIST_IMAGES) {
      setToast(`Please upload at least ${MIN_CHECKLIST_IMAGES} clear product photos.`);
      return;
    }
    for (let i = 0; i < imgs.length; i += 1) {
      const dim = await readImageSize(imgs[i]!);
      if (!dim || dim.width < MIN_UPLOAD_IMAGE_SIDE || dim.height < MIN_UPLOAD_IMAGE_SIDE) {
        setToast(
          `Image ${i + 1} is too small. Minimum ${MIN_UPLOAD_IMAGE_SIDE}x${MIN_UPLOAD_IMAGE_SIDE}px required.`
        );
        return;
      }
    }
    if (!checklist.colorOk || !checklist.fabricOk) {
      setToast(
        "Image checklist failed: add ALT text showing one color-focused photo and one fabric/texture-focused photo."
      );
      return;
    }
    const bgHex = galleryBg.trim();
    const validBg =
      bgHex && /^#[0-9A-Fa-f]{3,8}$/.test(bgHex) ? bgHex : undefined;

    const product: Product = {
      id: targetId,
      title: name.trim() || "Untitled",
      slug: (slug || slugifyName(name)).trim() || targetId,
      brand: "Store",
      categorySlug,
      price: basePrice,
      mrp,
      discountPct,
      rating: 0,
      reviewCount: 0,
      inStock: stockTotal > 0,
      images: imgs,
      highlights: descPlain ? [descPlain.slice(0, 120)] : [],
      description: descPlain,
      reviews: [],
      stockLeft: stockTotal,
      sizeOptions: uniqSizes.length ? uniqSizes : undefined,
      colorOptions:
        uniqColors.length > 0
          ? uniqColors.map((c, i) => ({
              id: c.toLowerCase().replace(/\s+/g, "-"),
              label: c,
              hex: ["#111827", "#2563eb", "#dc2626", "#059669", "#7c3aed"][i % 5],
            }))
          : undefined,
      ...(validBg ? { galleryBackground: validBg } : {}),
    };

    upsertCatalogProduct(product);
    setProductMeta(targetId, {
      metaTitle: metaTitle || name,
      metaDescription: metaDesc,
      visible: true,
      flashSale: flash,
      imageAlts: Object.keys(imageAlts).length ? imageAlts : undefined,
    });
    window.dispatchEvent(new CustomEvent("lc-catalog"));
    setToast("Saving...");
  };

  const steps = 6;

  return (
    <div className="relative space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          {toast}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#0066ff]">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {t("wizardTitle")}
          </h3>
        </div>
        <div className="flex gap-1 text-[11px] font-bold text-slate-500">
          {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`h-8 w-8 rounded-full ${
                step === n
                  ? "bg-[#0066ff] text-white"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="block text-xs font-bold text-slate-500">
        {t("wizardTargetProduct")}
        <div className="mt-1 flex flex-wrap gap-2">
          <select
            value={targetId}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setTargetId(v);
              loadProduct(v, false);
            }}
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="">{t("wizardPickProduct")}</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.title}
              </option>
            ))}
            {targetId && !catalog.some((p) => p.id === targetId) ? (
              <option value={targetId}>
                {getProductById(targetId)?.title?.trim() ||
                  name.trim() ||
                  `${targetId.slice(0, 12)}…`}
              </option>
            ) : null}
          </select>
          <button
            type="button"
            onClick={() => {
              const id = newCatalogProductId();
              setTargetId(id);
              setName("");
              setSlug("");
              setCategorySlug("mens-wear");
              setSubSlug("");
              setDescHtml("");
              setMetaTitle("");
              setMetaDesc("");
              setImages([]);
              setVariants([]);
              setColorImages({});
              setGalleryBg("");
            }}
            className="rounded-xl border border-dashed border-[#0066ff] px-3 py-2 text-xs font-bold text-[#0066ff]"
          >
            {t("wizardNewProduct")}
          </button>
        </div>
      </label>

      {step === 1 ? (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500">
            {t("fieldName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("fieldSlugAuto")}
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("fieldCategory")}
            <select
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setSubSlug("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {tc(c.slug)}
                </option>
              ))}
            </select>
          </label>
          {subOptions.length > 0 ? (
            <label className="block text-xs font-bold text-slate-500">
              {t("fieldSubcategory")}
              <select
                value={subSlug}
                onChange={(e) => setSubSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              >
                <option value="">{t("pickSub")}</option>
                {subOptions.map((ch) => (
                  <option key={ch.slug} value={ch.slug}>
                    {ch.slug}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <p className="mb-2 text-xs font-bold text-slate-500">{t("fieldDescription")}</p>
          <RichTextEditor value={descHtml} onChange={setDescHtml} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500">
            {t("seoMetaTitle")}
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("seoMetaDesc")}
            <textarea
              rows={3}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          {(() => {
            const score = computeSeoScore(metaTitle, metaDesc);
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const previewUrl = `${origin}/product/${slug || targetId}`;
            return (
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {t("googlePreview")}
                  </p>
                  <GoogleSnippetPreview
                    title={metaTitle || name}
                    url={previewUrl}
                    description={metaDesc}
                  />
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t("seoScoreLabel")}: {score.score}/100
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        score.label === "good"
                          ? "bg-emerald-500"
                          : score.label === "warn"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    />
                    <span className="text-[11px] text-slate-500">
                      {score.hints.length
                        ? score.hints
                            .map((h) =>
                              t(`seoHint_${h}` as "seoHint_title_short")
                            )
                            .join(" · ")
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <p className="mb-2 text-xs font-bold text-slate-500">{t("uploadImages")}</p>
          <ImageDropCrop items={images} onChange={setImages} />
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-600 dark:bg-slate-900">
            <p className="font-bold text-slate-700 dark:text-slate-200">
              Quality checklist (live)
            </p>
            <ul className="mt-2 space-y-1">
              <li className={checklist.minCountOk ? "text-emerald-600" : "text-rose-600"}>
                {checklist.minCountOk ? "PASS" : "FAIL"} - Minimum {MIN_CHECKLIST_IMAGES} photos
              </li>
              <li className={checklist.resolutionOk ? "text-emerald-600" : "text-rose-600"}>
                {checklist.resolutionOk ? "PASS" : "FAIL"} - Each photo &gt;= {MIN_UPLOAD_IMAGE_SIDE}x
                {MIN_UPLOAD_IMAGE_SIDE}px
              </li>
              <li className={checklist.colorOk ? "text-emerald-600" : "text-rose-600"}>
                {checklist.colorOk ? "PASS" : "FAIL"} - At least one color-focused ALT text
              </li>
              <li className={checklist.fabricOk ? "text-emerald-600" : "text-rose-600"}>
                {checklist.fabricOk ? "PASS" : "FAIL"} - At least one fabric/texture ALT text
              </li>
            </ul>
            <p className={checklist.allOk ? "mt-2 text-emerald-700" : "mt-2 text-amber-700"}>
              {checklist.allOk
                ? "Ready to publish."
                : "Fix failed items before saving product."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t("galleryBgLabel")}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{t("galleryBgHint")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="color"
                aria-label={t("galleryBgLabel")}
                value={galleryBg || "#fafafa"}
                onChange={(e) => setGalleryBg(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white dark:border-slate-600"
              />
              <input
                type="text"
                value={galleryBg}
                onChange={(e) => setGalleryBg(e.target.value)}
                placeholder="#fafafa"
                className="w-32 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={() => setGalleryBg("")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-600"
              >
                {t("galleryBgClear")}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  "#fafafa",
                  "#ffffff",
                  "#f5f5f4",
                  "#f8fafc",
                  "#ecfdf5",
                  "#fef3c7",
                  "#e0e7ff",
                  "#1e293b",
                ] as const
              ).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => setGalleryBg(hex)}
                  className="h-9 w-9 rounded-lg border-2 border-slate-200 shadow-sm ring-offset-2 transition hover:ring-2 hover:ring-[#0066ff]/40 dark:border-slate-600"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <VariantMatrix
          key={targetId}
          baseSlug={slug || "sku"}
          defaultPrice={priceDemo}
          variants={variants}
          onChange={setVariants}
          colorImages={colorImages}
          onColorImageChange={(color, url) => {
            if (url) setColorImages((prev) => ({ ...prev, [color]: url }));
            else {
              setColorImages((prev) => {
                const n = { ...prev };
                delete n[color];
                return n;
              });
            }
          }}
        />
      ) : null}

      {step === 6 ? (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-600">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t("wizardFlashTitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-bold text-slate-500">
              {t("flashHours")}
              <input
                type="number"
                min={1}
                value={flashH}
                onChange={(e) => setFlashH(e.target.value)}
                className="mt-1 block w-28 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="text-xs font-bold text-slate-500">
              {t("couponPercent")}
              <input
                type="number"
                min={1}
                value={flashPct}
                onChange={(e) => setFlashPct(e.target.value)}
                className="mt-1 block w-28 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500">{t("wizardFlashHint")}</p>
          <button
            type="button"
            onClick={() => void saveMeta()}
            className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-extrabold text-white"
          >
            {t("saveSeoFlash")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-600">
        <button
          type="button"
          disabled={step <= 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("wizardBack")}
        </button>
        {step < steps ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(steps, s + 1))}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
          >
            {t("wizardNext")}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void saveMeta()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white"
          >
            {t("saveProduct")}
          </button>
        )}
      </div>
      <p className="text-center text-[11px] text-slate-400">{t("demoSaveNote")}</p>
    </div>
  );
}
