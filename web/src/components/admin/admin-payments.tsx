"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mockTransactions,
  mockPayouts,
  type AdminTransaction,
} from "@/lib/admin-types";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { appendActivityLog } from "@/lib/admin-security-storage";
import { confirmCodOrder } from "@/lib/cod-order-sync";
import { CashCodReconciliation } from "@/components/admin/cash-cod-reconciliation";
import { RazorpayPaymentsPanel } from "@/components/admin/razorpay-payments-panel";
import { useAuth } from "@/context/auth-context";
import { CreditCard, RefreshCw, Truck } from "lucide-react";

export function AdminPayments() {
  const t = useTranslations("admin");
  const { user } = useAuth();
  const getAuthHeader = useCallback(async () => {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const [txRows, setTxRows] = useState<AdminTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);
  const [txFromApi, setTxFromApi] = useState(false);
  const [codOrderId, setCodOrderId] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: await getAuthHeader(),
      });
      const j = (await res.json().catch(() => ({}))) as {
        transactions?: AdminTransaction[];
        error?: string;
      };
      if (res.status === 503) {
        setTxRows(mockTransactions);
        setTxFromApi(false);
        setTxError(t("paymentsTxServerUnavailable"));
        return;
      }
      if (!res.ok) {
        setTxRows(mockTransactions);
        setTxFromApi(false);
        setTxError(
          j.error ??
            (res.status === 401
              ? t("paymentsTxUnauthorized")
              : res.status === 403
                ? t("paymentsTxForbidden")
                : t("paymentsTxLoadFailed"))
        );
        return;
      }
      if (Array.isArray(j.transactions)) {
        setTxRows(j.transactions);
        setTxFromApi(true);
        setTxError(null);
      } else {
        setTxRows(mockTransactions);
        setTxFromApi(false);
      }
    } catch {
      setTxRows(mockTransactions);
      setTxFromApi(false);
      setTxError(t("paymentsTxLoadFailed"));
    } finally {
      setTxLoading(false);
    }
  }, [getAuthHeader, t]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions, user?.uid]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function markCodReceived() {
    const id = codOrderId.trim();
    if (!id) {
      setToast(t("codOrderIdRequired"));
      return;
    }
    confirmCodOrder(id);
    appendActivityLog({
      actor: "admin",
      action: "payments.cod_confirmed",
      detail: id,
    });
    setToast(t("codMarkedOk", { id }));
  }

  return (
    <div className="relative space-y-8">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[100] max-w-md rounded-xl border border-emerald-500/30 bg-emerald-950 px-4 py-3 text-sm font-semibold text-emerald-50 shadow-xl dark:bg-emerald-950/95"
        >
          {toast}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-sky-100/80 bg-gradient-to-r from-[#0066ff]/[0.12] via-cyan-500/[0.08] to-emerald-100/25 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] to-cyan-600 text-white shadow-lg shadow-sky-300/30 dark:shadow-sky-950/40">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0066ff]">
                {t("paymentsHeroEyebrow")}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {t("paymentsTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("paymentsSubtitle")}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("paymentsHeroHint")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <RazorpayPaymentsPanel />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <CashCodReconciliation />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <CreditCard className="h-5 w-5 text-[#0066ff]" />
            {t("txnLogs")}
          </div>
          <button
            type="button"
            onClick={() => void loadTransactions()}
            disabled={txLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${txLoading ? "animate-spin" : ""}`}
            />
            {t("paymentsTxRefresh")}
          </button>
        </div>
        {txError ? (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            {txError}
          </p>
        ) : null}
        {!txFromApi && !txLoading && !txError ? (
          <p className="mb-3 text-xs text-slate-500">{t("paymentsTxDemoNote")}</p>
        ) : null}
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
              {txLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    {t("paymentsTxLoading")}
                  </td>
                </tr>
              ) : txRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    {t("paymentsTxEmpty")}
                  </td>
                </tr>
              ) : (
                txRows.map((x) => (
                  <tr
                    key={x.id + x.orderId}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Truck className="h-5 w-5 text-amber-600" />
          {t("payoutsTitle")}
        </div>
        <p className="mb-3 text-xs text-slate-500">{t("paymentsPayoutsDemo")}</p>
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
