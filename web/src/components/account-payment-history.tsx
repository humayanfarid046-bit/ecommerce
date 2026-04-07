"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getUserPaymentHistory,
  seedRefundTrackerIfEmpty,
  type UserPaymentRecord,
} from "@/lib/user-payment-history";
import { Receipt, RefreshCw } from "lucide-react";

function refundLabel(step: UserPaymentRecord["refundStep"], t: (k: string) => string) {
  if (step === "bank_processing") return t("refundStatusBank");
  if (step === "refunded") return t("refundStatusDone");
  return "—";
}

export function AccountPaymentHistory() {
  const t = useTranslations("account");
  const [rows, setRows] = useState<UserPaymentRecord[]>([]);

  useEffect(() => {
    seedRefundTrackerIfEmpty();
    setRows(getUserPaymentHistory());
    function sync() {
      setRows(getUserPaymentHistory());
    }
    window.addEventListener("lc-user-payment-history", sync);
    return () => window.removeEventListener("lc-user-payment-history", sync);
  }, []);

  const refunds = rows.filter((r) => r.refundStep !== "none");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <RefreshCw className="h-5 w-5 text-[#0066ff]" />
          {t("refundTrackerTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("refundTrackerHint")}
        </p>
        {refunds.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t("refundTrackerEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {refunds.map((r) => (
              <li
                key={r.id}
                className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-slate-700/80"
              >
                <div>
                  <p className="font-mono text-xs text-slate-500">{r.orderId}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    ₹{r.amountRupees.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-bold ${
                      r.refundStep === "refunded"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {refundLabel(r.refundStep, t)}
                  </p>
                  {r.refundTxnId ? (
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {r.refundTxnId}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Receipt className="h-5 w-5 text-violet-600" />
          {t("txnHistoryTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("txnHistoryHint")}
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs dark:border-slate-700 dark:bg-slate-800/80">
                <th className="p-3 font-bold">{t("txnColWhen")}</th>
                <th className="p-3 font-bold">{t("txnColOrder")}</th>
                <th className="p-3 font-bold">{t("txnColTxn")}</th>
                <th className="p-3 font-bold">{t("txnColMethod")}</th>
                <th className="p-3 font-bold">{t("txnColAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                    {new Date(r.at).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs">{r.orderId}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">
                    {r.paymentTxnId}
                  </td>
                  <td className="p-3 text-xs">{r.method}</td>
                  <td className="p-3 font-semibold">
                    ₹{r.amountRupees.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
