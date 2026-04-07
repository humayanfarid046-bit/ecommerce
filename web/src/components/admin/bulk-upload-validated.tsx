"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Download, FileArchive } from "lucide-react";
import type { Product } from "@/lib/product-model";
import {
  newCatalogProductId,
  upsertCatalogProduct,
} from "@/lib/catalog-products-storage";
import { slugifyName } from "@/lib/product-admin-meta";

type RowErr = { row: number; message: string };

const TEMPLATE = `title,slug,category,price,mrp,stock
`;

function validateCsv(text: string): RowErr[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const errs: RowErr[] = [];
  if (lines.length < 2) {
    errs.push({ row: 1, message: "Need a header row and at least one data row." });
    return errs;
  }
  const header = lines[0].toLowerCase();
  if (!header.includes("title") || !header.includes("price")) {
    errs.push({ row: 1, message: "Header must include title and price columns." });
  }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
    const price = Number(parts[3]);
    const stock = Number(parts[5]);
    if (!parts[0]) errs.push({ row: i + 1, message: "Missing title." });
    if (!Number.isFinite(price) || price <= 0)
      errs.push({ row: i + 1, message: "Invalid price (must be a positive number)." });
    if (parts[2] && !parts[2].includes("-"))
      errs.push({ row: i + 1, message: "Category should be a slug like mens-wear." });
    if (!Number.isFinite(stock) || stock < 0)
      errs.push({ row: i + 1, message: "Invalid stock." });
  }
  return errs;
}

function parseProductsFromCsv(text: string): Product[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const out: Product[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
    if (!parts[0]) continue;
    const title = parts[0];
    const slug = (parts[1] || slugifyName(title)).trim() || slugifyName(title);
    const categorySlug = (parts[2] || "mens-wear").trim();
    const price = Number(parts[3]);
    const mrp = Number(parts[4]);
    const stock = Number(parts[5]);
    if (!Number.isFinite(price) || price <= 0) continue;
    const mrpSafe = Number.isFinite(mrp) && mrp > 0 ? mrp : Math.round(price * 1.2);
    const discountPct =
      mrpSafe > price
        ? Math.round(((mrpSafe - price) / mrpSafe) * 100)
        : 0;
    const id = newCatalogProductId();
    out.push({
      id,
      title,
      slug,
      brand: "Store",
      categorySlug,
      price,
      mrp: mrpSafe,
      discountPct,
      rating: 0,
      reviewCount: 0,
      inStock: Number.isFinite(stock) ? stock > 0 : true,
      images: [],
      highlights: [title],
      description: title,
      reviews: [],
      stockLeft: Number.isFinite(stock) ? stock : 0,
    });
  }
  return out;
}

export function BulkUploadValidated() {
  const t = useTranslations("admin");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<RowErr[]>([]);
  const [zipName, setZipName] = useState<string | null>(null);

  const run = useCallback(() => {
    setErrors(validateCsv(text));
  }, [text]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob(["\uFEFF" + TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const onZip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setZipName(f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : null);
    e.target.value = "";
  };

  const ok = errors.length === 0 && text.trim().length > 0;

  const importRows = useCallback(() => {
    const rows = parseProductsFromCsv(text);
    for (const p of rows) {
      upsertCatalogProduct(p);
    }
    window.dispatchEvent(new CustomEvent("lc-catalog"));
    window.alert(t("bulkImported", { n: rows.length }));
  }, [text, t]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t("bulkTitle")}
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          {t("bulkDownloadTemplate")}
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setErrors([]);
        }}
        className="h-48 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
        placeholder="title,slug,category,price,mrp,stock"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={run}
          className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-extrabold text-white"
        >
          {t("bulkValidate")}
        </button>
        {ok ? (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {t("bulkOk")}
          </span>
        ) : null}
        {ok ? (
          <button
            type="button"
            onClick={importRows}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white"
          >
            {t("bulkImport")}
          </button>
        ) : null}
      </div>
      {errors.length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900 dark:bg-rose-950/40">
          <p className="flex items-center gap-1 font-bold text-rose-800 dark:text-rose-200">
            <AlertCircle className="h-4 w-4" />
            {t("bulkReportTitle")}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-rose-900 dark:text-rose-100">
            {errors.map((e) => (
              <li key={`${e.row}-${e.message}`}>
                {t("bulkRowError", { row: e.row, message: e.message })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-600">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <FileArchive className="h-4 w-4" />
          {t("bulkZipTitle")}
        </div>
        <p className="mt-1 text-xs text-slate-500">{t("bulkZipHint")}</p>
        <label className="mt-2 inline-block cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold dark:bg-slate-800">
          {t("bulkZipPick")}
          <input type="file" accept=".zip,application/zip" className="sr-only" onChange={onZip} />
        </label>
        {zipName ? <p className="mt-2 text-xs text-slate-600">{zipName}</p> : null}
      </div>
    </div>
  );
}
