"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getLowStockActionRows,
  getStockSeverity,
  predictDaysUntilStockout,
  type LowStockActionRow,
} from "@/lib/admin-types";
import {
  ExternalLink,
  Mail,
  Pencil,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";

function rowTone(sev: ReturnType<typeof getStockSeverity>): string {
  switch (sev) {
    case "out":
      return "border-slate-900 bg-slate-900 text-white dark:border-slate-100";
    case "critical":
      return "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100";
    case "warning":
      return "border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100";
    default:
      return "border-slate-200 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";
  }
}

export function LowStockActionCenter() {
  const t = useTranslations("admin");
  const tc = useTranslations("categories");
  const baseRows = useMemo(() => getLowStockActionRows(), []);

  const [stockById, setStockById] = useState<Record<string, number>>(() =>
    Object.fromEntries(baseRows.map((r) => [r.id, r.stock]))
  );
  const [thresholdById, setThresholdById] = useState<Record<string, number>>(() =>
    Object.fromEntries(baseRows.map((r) => [r.id, r.threshold]))
  );
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [thresholdEditId, setThresholdEditId] = useState<string | null>(null);
  const [draftStock, setDraftStock] = useState("");
  const [draftThreshold, setDraftThreshold] = useState("");

  const rows: LowStockActionRow[] = useMemo(
    () =>
      baseRows.map((r) => ({
        ...r,
        stock: stockById[r.id] ?? r.stock,
        threshold: thresholdById[r.id] ?? r.threshold,
      })),
    [baseRows, stockById, thresholdById]
  );

  const applyRestock = useCallback(() => {
    if (!stockEditId) return;
    const n = parseInt(draftStock, 10);
    if (!Number.isFinite(n) || n < 0) return;
    setStockById((prev) => ({ ...prev, [stockEditId]: n }));
    setStockEditId(null);
  }, [draftStock, stockEditId]);

  const applyThreshold = useCallback(() => {
    if (!thresholdEditId) return;
    const n = parseInt(draftThreshold, 10);
    if (!Number.isFinite(n) || n < 0) return;
    setThresholdById((prev) => ({ ...prev, [thresholdEditId]: n }));
    setThresholdEditId(null);
  }, [draftThreshold, thresholdEditId]);

  const notifyOps = useCallback(
    (row: LowStockActionRow) => {
      window.alert(
        t("lowStockAlertDemo", { email: row.opsContactEmail, product: row.title })
      );
    },
    [t]
  );

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-extrabold">{t("lowStockActionTitle")}</p>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200/90">
              {t("lowStockActionHint")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="mailto:suppliers@libas.demo?subject=Reorder%20request"
            className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 shadow-sm hover:bg-amber-100/80 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("contactSupplier")}
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 shadow-sm hover:bg-amber-100/80 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-slate-800"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {t("buyLinkStore")}
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-amber-200/80 dark:border-amber-800/60">
              <th className="pb-2 pr-2 font-bold text-slate-900 dark:text-slate-100">
                {t("colProduct")}
              </th>
              <th className="pb-2 pr-2 font-bold text-slate-900 dark:text-slate-100">
                {t("colCategory")}
              </th>
              <th className="pb-2 pr-2 font-bold text-slate-900 dark:text-slate-100">
                {t("colThreshold")}
              </th>
              <th className="pb-2 pr-2 font-bold text-slate-900 dark:text-slate-100">
                {t("colStock")}
              </th>
              <th className="pb-2 pr-2 font-bold text-slate-900 dark:text-slate-100">
                {t("colPredict")}
              </th>
              <th className="pb-2 font-bold text-slate-900 dark:text-slate-100">
                {t("colActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const sev = getStockSeverity(row.stock);
              const predict = predictDaysUntilStockout(
                row.stock,
                row.weeklySalesUnits
              );
              const editStock = stockEditId === row.id;
              const editTh = thresholdEditId === row.id;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-amber-100/80 align-top dark:border-amber-900/50 ${rowTone(sev)}`}
                >
                  <td className="py-3 pr-2 font-medium">
                    <div className="max-w-[220px] leading-snug">{row.title}</div>
                    <div className="mt-1 text-[11px] opacity-80">{row.brand}</div>
                  </td>
                  <td className="py-3 pr-2 text-xs">{tc(row.categorySlug)}</td>
                  <td className="py-3 pr-2">
                    {editTh ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          className="w-16 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                          value={draftThreshold}
                          onChange={(e) => setDraftThreshold(e.target.value)}
                        />
                        <button
                          type="button"
                          className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white"
                          onClick={applyThreshold}
                        >
                          {t("save")}
                        </button>
                        <button
                          type="button"
                          className="text-[10px] font-semibold underline"
                          onClick={() => setThresholdEditId(null)}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold tabular-nums underline-offset-2 hover:underline"
                        onClick={() => {
                          setThresholdEditId(row.id);
                          setDraftThreshold(
                            String(thresholdById[row.id] ?? row.threshold)
                          );
                          setStockEditId(null);
                        }}
                      >
                        ≤{thresholdById[row.id] ?? row.threshold}
                        <Pencil className="h-3 w-3 opacity-70" />
                      </button>
                    )}
                  </td>
                  <td className="py-3 pr-2">
                    <span
                      className={`inline-flex min-w-[2rem] tabular-nums font-extrabold ${
                        sev === "out"
                          ? "text-white"
                          : sev === "critical"
                            ? "text-red-700 dark:text-red-300"
                            : sev === "warning"
                              ? "text-orange-800 dark:text-orange-200"
                              : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {row.stock}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-xs leading-snug">
                    {predict == null
                      ? "—"
                      : predict === 0
                        ? t("predictNow")
                        : t("predictDays", { n: predict })}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      {editStock ? (
                        <div className="flex flex-wrap items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            className="w-20 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                            value={draftStock}
                            onChange={(e) => setDraftStock(e.target.value)}
                          />
                          <button
                            type="button"
                            className="rounded bg-[#0066ff] px-2 py-0.5 text-[10px] font-bold text-white"
                            onClick={applyRestock}
                          >
                            {t("restockSave")}
                          </button>
                          <button
                            type="button"
                            className="text-[10px] font-semibold underline"
                            onClick={() => setStockEditId(null)}
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex w-fit items-center gap-0.5 rounded-lg border border-current px-2 py-1 text-[11px] font-bold"
                          onClick={() => {
                            setStockEditId(row.id);
                            setDraftStock(String(row.stock));
                            setThresholdEditId(null);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                          {t("restock")}
                        </button>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 rounded-lg border border-current px-2 py-1 text-[11px] font-bold"
                          onClick={() => notifyOps(row)}
                        >
                          <Mail className="h-3 w-3" />
                          {t("lowStockNotify")}
                        </button>
                        <Link
                          href={`/product/${row.id}`}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-current px-2 py-1 text-[11px] font-bold"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          {t("buyLink")}
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">
        {t("lowStockDemoNote")}
      </p>
    </div>
  );
}
