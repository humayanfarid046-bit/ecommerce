"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Wand2 } from "lucide-react";

export type VariantRow = {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stock: number;
  weightG: number;
};

function parseList(s: string): string[] {
  return s
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function cartesian(sizes: string[], colors: string[]): { size: string; color: string }[] {
  const out: { size: string; color: string }[] = [];
  for (const size of sizes) {
    for (const color of colors) {
      out.push({ size, color });
    }
  }
  return out;
}

function randomSku(prefix: string, size: string, color: string, i: number): string {
  const safe = `${prefix}-${size}-${color}`.replace(/\s+/g, "-").toUpperCase();
  const hash = (i * 7919 + safe.length * 31).toString(36).slice(0, 4).toUpperCase();
  return `${safe}-${hash}`;
}

type Props = {
  baseSlug: string;
  defaultPrice: number;
  variants: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  colorImages: Record<string, string>;
  onColorImageChange: (color: string, dataUrl: string | null) => void;
};

export function VariantMatrix({
  baseSlug,
  defaultPrice,
  variants,
  onChange,
  colorImages,
  onColorImageChange,
}: Props) {
  const t = useTranslations("admin");
  const [sizesRaw, setSizesRaw] = useState("M, L, XL");
  const [colorsRaw, setColorsRaw] = useState("Red, Navy");

  /** Keep matrix text fields in sync when parent loads or replaces variants (e.g. edit product). */
  useEffect(() => {
    if (variants.length === 0) return;
    const sizes = [...new Set(variants.map((v) => v.size))];
    const colors = [...new Set(variants.map((v) => v.color))];
    setSizesRaw(sizes.join(", "));
    setColorsRaw(colors.join(", "));
  }, [variants]);

  const uniqueColors = useMemo(() => {
    const set = new Set(variants.map((v) => v.color));
    return [...set];
  }, [variants]);

  const generate = useCallback(() => {
    const sizes = parseList(sizesRaw);
    const colors = parseList(colorsRaw);
    if (!sizes.length || !colors.length) return;
    const pairs = cartesian(sizes, colors);
    const rows: VariantRow[] = pairs.map((p, i) => ({
      id: `v-${i}-${p.size}-${p.color}`,
      size: p.size,
      color: p.color,
      sku: randomSku(baseSlug || "SKU", p.size, p.color, i),
      price: defaultPrice,
      stock: 20,
      weightG: 280,
    }));
    onChange(rows);
  }, [sizesRaw, colorsRaw, baseSlug, defaultPrice, onChange]);

  const updateRow = (id: string, patch: Partial<VariantRow>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-600">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-500">
          {t("matrixSizes")}
          <input
            value={sizesRaw}
            onChange={(e) => setSizesRaw(e.target.value)}
            className="mt-1 w-full min-w-[200px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="M, L, XL"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("matrixColors")}
          <input
            value={colorsRaw}
            onChange={(e) => setColorsRaw(e.target.value)}
            className="mt-1 w-full min-w-[200px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="Red, Blue"
          />
        </label>
        <button
          type="button"
          onClick={generate}
          className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-sm font-extrabold text-white"
        >
          <Wand2 className="h-4 w-4" />
          {t("matrixGenerate")}
        </button>
      </div>

      <p className="text-[11px] text-slate-500">{t("matrixColorImageHint")}</p>
      <div className="flex flex-wrap gap-3">
        {uniqueColors.map((c) => (
          <label
            key={c}
            className="flex cursor-pointer flex-col gap-1 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-600"
          >
            <span className="font-bold text-slate-700 dark:text-slate-200">{c}</span>
            <input
              type="file"
              accept="image/*"
              className="max-w-[180px] text-[10px]"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                  void new Promise<void>((resolve) => {
                    const r = new FileReader();
                    r.onload = () => {
                      onColorImageChange(c, r.result as string);
                      resolve();
                    };
                    r.readAsDataURL(f);
                  });
                e.target.value = "";
              }}
            />
            {colorImages[c] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={colorImages[c]}
                alt=""
                className="mt-1 h-14 w-14 rounded object-cover"
              />
            ) : null}
          </label>
        ))}
      </div>

      {variants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 dark:border-slate-600">
                <th className="pb-2 pr-2">{t("varSize")}</th>
                <th className="pb-2 pr-2">{t("varColor")}</th>
                <th className="pb-2 pr-2">{t("varSku")}</th>
                <th className="pb-2 pr-2">{t("varWeight")}</th>
                <th className="pb-2 pr-2">{t("varPrice")}</th>
                <th className="pb-2">{t("varStock")}</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 pr-2">{v.size}</td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span>{v.color}</span>
                      {colorImages[v.color] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={colorImages[v.color]}
                          alt=""
                          className="h-8 w-8 rounded border object-cover"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 font-mono text-[11px]">{v.sku}</td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-200 px-1 dark:border-slate-600 dark:bg-slate-950"
                      value={v.weightG}
                      onChange={(e) =>
                        updateRow(v.id, { weightG: Number(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      className="w-24 rounded border border-slate-200 px-1 dark:border-slate-600 dark:bg-slate-950"
                      value={v.price}
                      onChange={(e) =>
                        updateRow(v.id, { price: Number(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="py-1.5">
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-200 px-1 dark:border-slate-600 dark:bg-slate-950"
                      value={v.stock}
                      onChange={(e) =>
                        updateRow(v.id, { stock: Number(e.target.value) || 0 })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-400">{t("matrixEmpty")}</p>
      )}
    </div>
  );
}
