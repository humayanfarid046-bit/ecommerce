"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mockCodCashSummary,
  mockCodRemittance,
  mockRiderCash,
  type RiderCashRow,
} from "@/lib/admin-mock-data";
import { Banknote, Bike, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const RIDERS_KEY = "lc_cod_riders_v1";

function readRiders(): RiderCashRow[] {
  if (typeof window === "undefined") return mockRiderCash;
  try {
    const raw = localStorage.getItem(RIDERS_KEY);
    if (!raw) return mockRiderCash;
    const p = JSON.parse(raw) as RiderCashRow[];
    return Array.isArray(p) && p.length ? p : mockRiderCash;
  } catch {
    return mockRiderCash;
  }
}

function writeRiders(rows: RiderCashRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RIDERS_KEY, JSON.stringify(rows));
}

export function CashCodReconciliation() {
  const t = useTranslations("admin");
  const [riders, setRiders] = useState<RiderCashRow[]>(mockRiderCash);

  useEffect(() => {
    setRiders(readRiders());
  }, []);

  function markRiderPaid(id: string) {
    setRiders((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, pendingCash: 0, settled: true } : r
      );
      writeRiders(next);
      return next;
    });
    window.alert(t("riderSettledDemo"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
          <Banknote className="h-5 w-5 text-emerald-600" />
          {t("codCashTitle")}
        </h3>
        <p className="text-sm text-slate-500">{t("codCashSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <p className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-200">
            {t("codDeliveredToday")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-900 dark:text-emerald-100">
            ₹{mockCodCashSummary.todayDeliveredCod.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/25">
          <p className="text-xs font-bold uppercase text-sky-800 dark:text-sky-200">
            {t("cashInHand")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-sky-900 dark:text-sky-100">
            ₹{mockCodCashSummary.cashInHand.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Truck className="h-5 w-5 text-amber-600" />
          {t("remittanceTitle")}
        </div>
        <div className="space-y-2">
          {mockCodRemittance.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <p className="font-bold">{r.courier}</p>
                <p className="text-xs text-slate-500">
                  {t("dueDate")}: {r.dueDate}
                </p>
              </div>
              <p className="font-extrabold">
                ₹{r.amount.toLocaleString("en-IN")}
              </p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  r.status === "received"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950/40"
                )}
              >
                {r.status === "received" ? t("remittanceReceived") : t("remittancePending")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Bike className="h-5 w-5 text-violet-600" />
          {t("riderSettlementTitle")}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              <tr>
                <th className="p-3 font-bold">{t("colName")}</th>
                <th className="p-3 font-bold">{t("riderPending")}</th>
                <th className="p-3 font-bold">{t("riderToday")}</th>
                <th className="p-3 font-bold">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 tabular-nums">
                    ₹{r.pendingCash.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 tabular-nums text-slate-600">
                    ₹{r.todayCollected.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3">
                    {r.settled ? (
                      <span className="text-xs font-bold text-emerald-600">
                        {t("riderSettled")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRiderPaid(r.id)}
                        className="rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        {t("markRiderPaid")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
