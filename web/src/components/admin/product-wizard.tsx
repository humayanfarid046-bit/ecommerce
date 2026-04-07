"use client";

import { useCallback, useEffect, useState } from "react";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { useTranslations } from "next-intl";
import { categories, getProductById } from "@/lib/mock-data";
import type { Product } from "@/lib/product-model";
import {
  getProductMeta,
  setProductMeta,
  slugifyName,
} from "@/lib/product-admin-meta";
import {
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

type Img = GalleryItem;

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

  const priceDemo = getProductById(targetId)?.price ?? 1999;

  useEffect(() => {
    setSlug(slugifyName(name));
  }, [name]);

  const loadProduct = useCallback(
    (id: string, dup: boolean) => {
      const p = getProductById(id);
      if (!p) return;
      if (!dup) setTargetId(p.id);
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
          const id = `ex-${i}`;
          return {
            id,
            src,
            name: `image-${i}.jpg`,
            alt: alts[id] ?? "",
          };
        })
      );
      setVariants([]);
      setColorImages({});
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

  const saveMeta = () => {
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
    window.alert(t("wizardSavedDemo"));
  };

  const steps = 6;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
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
            value={catalog.some((p) => p.id === targetId) ? targetId : ""}
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
        <div>
          <p className="mb-2 text-xs font-bold text-slate-500">{t("uploadImages")}</p>
          <ImageDropCrop items={images} onChange={setImages} />
        </div>
      ) : null}

      {step === 5 ? (
        <VariantMatrix
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
            onClick={saveMeta}
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
            onClick={saveMeta}
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
