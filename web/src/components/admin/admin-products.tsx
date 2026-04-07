"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ProductWizard } from "@/components/admin/product-wizard";
import { ProductCatalog } from "@/components/admin/product-catalog";
import { BulkUploadValidated } from "@/components/admin/bulk-upload-validated";
import { CouponAdvanced } from "@/components/admin/coupon-advanced";
import { Tag } from "lucide-react";
import { setCategoryDiscountForSlug } from "@/lib/category-discount-storage";

function CategoryDiscountPanel() {
  const t = useTranslations("admin");
  const tc = useTranslations("categories");
  const [slug, setSlug] = useState(categories[0]?.slug ?? "mens-wear");
  const [pct, setPct] = useState(10);

  const save = () => {
    try {
      setCategoryDiscountForSlug(slug, pct);
      window.alert(t("categoryDiscountSaved"));
    } catch {
      window.alert(t("categoryDiscountError"));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
        <Tag className="h-5 w-5 text-violet-600" />
        {t("categoryDiscountTitle")}
      </div>
      <p className="mt-1 text-sm text-slate-500">{t("categoryDiscountHint")}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-xs font-bold text-slate-500">
          {t("fieldCategory")}
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {tc(c.slug)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-500">
          {t("categoryDiscountPct")}
          <input
            type="number"
            min={1}
            max={90}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="mt-1 block w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="mt-6 rounded-xl bg-violet-600 px-4 py-2 text-sm font-extrabold text-white"
        >
          {t("categoryDiscountApply")}
        </button>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<
    "wizard" | "catalog" | "bulk" | "coupon" | "catdisc"
  >("wizard");
  const [editId, setEditId] = useState<string | null>(null);
  const [dupId, setDupId] = useState<string | null>(null);

  const onClearDuplicate = useCallback(() => setDupId(null), []);

  const tabs = [
    { id: "wizard" as const, label: t("tabWizard") },
    { id: "catalog" as const, label: t("tabCatalog") },
    { id: "bulk" as const, label: t("tabBulk") },
    { id: "coupon" as const, label: t("tabCoupon") },
    { id: "catdisc" as const, label: t("tabCategoryDiscount") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("productsTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("productsSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold",
              tab === x.id
                ? "bg-[#0066ff] text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "wizard" ? (
        <ProductWizard
          editProductId={editId}
          duplicateFromId={dupId}
          onClearDuplicate={onClearDuplicate}
        />
      ) : null}

      {tab === "catalog" ? (
        <ProductCatalog
          onEdit={(id) => {
            setEditId(id);
            setTab("wizard");
          }}
          onDuplicate={(id) => {
            setDupId(id);
            setTab("wizard");
          }}
        />
      ) : null}

      {tab === "bulk" ? <BulkUploadValidated /> : null}
      {tab === "coupon" ? <CouponAdvanced /> : null}
      {tab === "catdisc" ? <CategoryDiscountPanel /> : null}
    </div>
  );
}
