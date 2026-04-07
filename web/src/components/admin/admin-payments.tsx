"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  mockTransactions,
  mockPayouts,
} from "@/lib/admin-mock-data";
import { appendActivityLog } from "@/lib/admin-security-storage";
import { confirmCodOrder } from "@/lib/cod-order-sync";
import { CashCodReconciliation } from "@/components/admin/cash-cod-reconciliation";
import { RazorpayPaymentsPanel } from "@/components/admin/razorpay-payments-panel";
import { CreditCard, Truck } from "lucide-react";

export function AdminPayments() {
  const t = useTranslations("admin");
  const [codOrderId, setCodOrderId] = useState("");

  function markCodReceived() {
    const id = codOrderId.trim();
    if (!id) {
      window.alert(t("codOrderIdRequired"));
      return;
    }
    confirmCodOrder(id);
    appendActivityLog({
      actor: "admin",
      action: "payments.cod_confirmed",
      detail: id,
    });
    window.alert(t("codMarkedOk", { id }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("paymentsTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("paymentsSubtitle")}</p>
      </div>

      <RazorpayPaymentsPanel />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <CashCodReconciliation />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <CreditCard className="h-5 w-5 text-[#0066ff]" />
          {t("txnLogs")}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                <th className="p-3 font-bold">{t("colTxnId")}</th>
                <th className="p-3 font-bold">{t("colOrderId")}</th>
                <th className="p-3 font-bold">{t("colMethod")}</th>
                <th className="p-3 font-bold">{t("colAmount")}</th>
                <th className="p-3 font-bold">{t("colPayStatus")}</th>
                <th className="p-3 font-bold">{t("colAt")}</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((x) => (
                <tr
                  key={x.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="p-3 font-mono text-xs">{x.id}</td>
                  <td className="p-3 font-mono text-xs">{x.orderId}</td>
                  <td className="p-3">{x.method}</td>
                  <td className="p-3">₹{x.amount.toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <span
                      className={
                        x.status === "success"
                          ? "font-bold text-emerald-600"
                          : "font-bold text-rose-600"
                      }
                    >
                      {x.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{x.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Truck className="h-5 w-5 text-amber-600" />
          {t("payoutsTitle")}
        </div>
        <div className="space-y-2">
          {mockPayouts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <p className="font-bold">{p.label}</p>
                <p className="text-xs text-slate-500">{p.date}</p>
              </div>
              <p className="font-extrabold">
                ₹{p.amount.toLocaleString("en-IN")}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  p.status === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100">
          {t("codTitle")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{t("codHint")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-xs font-bold text-slate-500">
            {t("codOrderId")}
            <input
              value={codOrderId}
              onChange={(e) => setCodOrderId(e.target.value)}
              placeholder={t("codOrderIdPlaceholder")}
              autoComplete="off"
              className="mt-1 block min-w-[12rem] rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <button
            type="button"
            onClick={markCodReceived}
            className="self-end rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
          >
            {t("codMarkReceived")}
          </button>
        </div>
      </div>
    </div>
  );
}
