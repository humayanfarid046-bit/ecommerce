"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getProducts } from "@/lib/storefront-catalog";
import { getProductMeta, setProductMeta } from "@/lib/product-admin-meta";
import { Copy, Pencil, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Props = {
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
};

export function ProductCatalog({ onEdit, onDuplicate }: Props) {
  const t = useTranslations("admin");
  const tc = useTranslations("categories");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [tick, bump] = useState(0);

  useEffect(() => {
    const fn = () => bump((n) => n + 1);
    window.addEventListener("lc-product-meta", fn);
    window.addEventListener("lc-catalog", fn);
    return () => {
      window.removeEventListener("lc-product-meta", fn);
      window.removeEventListener("lc-catalog", fn);
    };
  }, []);

  const rows = useMemo(() => {
    const products = getProducts();
    return products.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (cat && p.categorySlug !== cat) return false;
      const min = priceMin ? Number(priceMin) : NaN;
      const max = priceMax ? Number(priceMax) : NaN;
      if (Number.isFinite(min) && p.price < min) return false;
      if (Number.isFinite(max) && p.price > max) return false;
      const stock =
        typeof p.stockLeft === "number"
          ? p.stockLeft
          : p.inStock
            ? 10
            : 0;
      if (stockFilter === "low" && stock >= 15) return false;
      if (stockFilter === "out" && stock > 0) return false;
      return true;
    });
  }, [query, cat, priceMin, priceMax, stockFilter, tick]);

  const toggleVisible = (id: string) => {
    const m = getProductMeta(id);
    const next = m.visible === false ? true : false;
    setProductMeta(id, { visible: next });
  };

  const applyFlash = (id: string, hours: number, pct: number) => {
    if (!hours || !pct) return;
    const endsAt = new Date(Date.now() + hours * 3600000).toISOString();
    setProductMeta(id, { flashSale: { endsAt, discountPct: pct } });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
          {t("catalogTitle")}
        </h3>
        <p className="text-[11px] text-slate-500">{t("catalogHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("catalogSearch")}
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        >
          <option value="">{t("couponAllProducts")}</option>
          {Array.from(new Set(getProducts().map((p) => p.categorySlug))).map((slug) => (
            <option key={slug} value={slug}>
              {tc(slug)}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder={t("priceMin")}
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          className="w-24 rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        />
        <input
          type="number"
          placeholder={t("priceMax")}
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          className="w-24 rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        />
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        >
          <option value="all">{t("stockAll")}</option>
          <option value="low">{t("stockLow")}</option>
          <option value="out">{t("stockOut")}</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400 dark:border-slate-600">
              <th className="pb-2">{t("catalogVisible")}</th>
              <th className="pb-2">{t("colProduct")}</th>
              <th className="pb-2">{t("colCategory")}</th>
              <th className="pb-2">{t("colPrice")}</th>
              <th className="pb-2">{t("colStock")}</th>
              <th className="pb-2">{t("catalogFlash")}</th>
              <th className="pb-2">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  {t("catalogEmpty")}
                </td>
              </tr>
            ) : null}
            {rows.map((p) => {
              const meta = getProductMeta(p.id);
              const visible = meta.visible !== false;
              const stock =
                typeof p.stockLeft === "number"
                  ? p.stockLeft
                  : p.inStock
                    ? 10
                    : 0;
              return (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={visible}
                      onClick={() => toggleVisible(p.id)}
                      className={`relative h-7 w-12 rounded-full transition ${
                        visible ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          visible ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-2 font-medium">{p.title}</td>
                  <td className="py-2 text-xs">{tc(p.categorySlug)}</td>
                  <td className="py-2 tabular-nums">₹{p.price.toLocaleString("en-IN")}</td>
                  <td className="py-2">{stock}</td>
                  <td className="py-2">
                    <FlashQuickRow onApply={(h, pct) => applyFlash(p.id, h, pct)} />
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold dark:border-slate-600"
                        onClick={() => onEdit(p.id)}
                      >
                        <Pencil className="mr-1 inline h-3 w-3" />
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold dark:border-slate-600"
                        onClick={() => onDuplicate(p.id)}
                      >
                        <Copy className="mr-1 inline h-3 w-3" />
                        {t("duplicate")}
                      </button>
                      <Link
                        href={`/product/${p.id}`}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold dark:border-slate-600"
                      >
                        {t("buyLink")}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlashQuickRow({
  onApply,
}: {
  onApply: (h: number, pct: number) => void;
}) {
  const t = useTranslations("admin");
  const [h, setH] = useState("2");
  const [pct, setPct] = useState("15");
  return (
    <div className="flex flex-wrap items-center gap-1">
      <input
        type="number"
        min={1}
        className="w-12 rounded border border-slate-200 px-1 text-xs dark:border-slate-600 dark:bg-slate-950"
        value={h}
        onChange={(e) => setH(e.target.value)}
        title={t("flashHours")}
      />
      <span className="text-[10px] font-bold text-slate-400">h</span>
      <input
        type="number"
        min={1}
        max={90}
        className="w-12 rounded border border-slate-200 px-1 text-xs dark:border-slate-600 dark:bg-slate-950"
        value={pct}
        onChange={(e) => setPct(e.target.value)}
        title={t("couponPercent")}
      />
      <span className="text-[10px] font-bold text-slate-400">%</span>
      <button
        type="button"
        className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
        onClick={() => onApply(Number(h) || 0, Number(pct) || 0)}
      >
        {t("applyFlash")}
      </button>
    </div>
  );
}
