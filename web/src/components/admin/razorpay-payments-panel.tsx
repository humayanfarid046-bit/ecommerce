"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getRzpLedger,
  markRefundedInLedger,
  type RzpLedgerEntry,
} from "@/lib/razorpay-ledger";
import {
  getGatewaySettings,
  saveGatewaySettings,
  getAutoInvoiceEnabled,
  setAutoInvoiceEnabled,
  type RazorpayGatewaySettings,
} from "@/lib/razorpay-gateway-settings";

const SETTLEMENT_ROWS = [
  {
    id: "stl_1",
    amount: 11_842_000,
    fee: 279_000,
    net: 11_563_000,
    utr: "AXISCN0123456789",
    at: "2026-04-05T18:00 IST",
    status: "processed" as const,
  },
  {
    id: "stl_2",
    amount: 6_420_000,
    fee: 151_000,
    net: 6_269_000,
    utr: "HDFCN9988776655",
    at: "2026-04-01T09:00 IST",
    status: "processed" as const,
  },
];

function statusBadgeClass(s: RzpLedgerEntry["status"]) {
  switch (s) {
    case "captured":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "failed":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";
    case "authorized":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
    case "refunded":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

export function RazorpayPaymentsPanel() {
  const t = useTranslations("admin");
  const [rows, setRows] = useState<RzpLedgerEntry[]>([]);
  const [cfg, setCfg] = useState<{
    configured: boolean;
    keyIdPreview: string;
    webhookConfigured: boolean;
  } | null>(null);
  const [gw, setGw] = useState<RazorpayGatewaySettings>(getGatewaySettings);
  const [autoInv, setAutoInv] = useState(getAutoInvoiceEnabled);
  const [refundBusy, setRefundBusy] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setRows(getRzpLedger());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("lc-rzp-ledger", refresh);
    return () => window.removeEventListener("lc-rzp-ledger", refresh);
  }, [refresh]);

  useEffect(() => {
    void fetch("/api/razorpay/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ configured: false, keyIdPreview: "", webhookConfigured: false }));
  }, [tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 8000);
    return () => window.clearInterval(id);
  }, []);

  const feeTotals = useMemo(() => {
    const captured = rows.filter((r) => r.status === "captured");
    const gross = captured.reduce((s, r) => s + r.amountPaise, 0);
    const fees = captured.reduce((s, r) => s + r.gatewayFeePaise, 0);
    const net = captured.reduce((s, r) => s + r.netPaise, 0);
    return { gross, fees, net };
  }, [rows]);

  async function doRefund(row: RzpLedgerEntry) {
    const pid = row.razorpayPaymentId;
    if (!pid || row.status !== "captured") return;
    setRefundBusy(pid);
    try {
      const res = await fetch("/api/razorpay/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: pid,
          amountPaise: row.amountPaise,
        }),
      });
      const data = (await res.json()) as {
        refundId?: string;
        amount?: number;
        error?: string;
        demo?: boolean;
      };
      if (res.ok && data.refundId) {
        markRefundedInLedger(pid, data.refundId, data.amount ?? row.amountPaise);
      } else {
        markRefundedInLedger(
          pid,
          `rfnd_demo_${Date.now().toString(36)}`,
          row.amountPaise
        );
      }
      refresh();
    } finally {
      setRefundBusy(null);
    }
  }

  function toggleGw<K extends keyof RazorpayGatewaySettings>(k: K) {
    const next = { ...gw, [k]: !gw[k] };
    saveGatewaySettings(next);
    setGw(next);
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {t("rzpPanelTitle")}
          </p>
          <p className="text-sm text-slate-500">{t("rzpPanelSubtitle")}</p>
        </div>
        <div
          className={`rounded-xl px-3 py-2 text-xs font-bold ${
            cfg?.configured
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
          }`}
        >
          {cfg?.configured ? t("rzpConnected") : t("rzpNotConfigured")}
          {cfg?.keyIdPreview ? (
            <span className="ml-2 font-mono font-normal opacity-80">
              {cfg.keyIdPreview}
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("rzpWebhookHint", {
          url: "/api/razorpay/webhook",
          on: cfg?.webhookConfigured ? t("rzpYes") : t("rzpNo"),
        })}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("rzpGatewayGate")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t("rzpGatewayHint")}</p>
          <ul className="mt-3 space-y-2">
            {(
              [
                ["upi", "rzpGwUpi"],
                ["card", "rzpGwCard"],
                ["netbanking", "rzpGwNet"],
                ["wallet", "rzpGwWallet"],
              ] as const
            ).map(([k, labelKey]) => (
              <li key={k}>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={gw[k]}
                    onChange={() => toggleGw(k)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0066ff]"
                  />
                  {t(labelKey)}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("rzpAutoInvoice")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t("rzpAutoInvoiceHint")}</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={autoInv}
              onChange={(e) => {
                setAutoInvoiceEnabled(e.target.checked);
                setAutoInv(e.target.checked);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[#0066ff]"
            />
            {t("rzpAutoInvoiceToggle")}
          </label>
        </div>

        <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/80 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
            {t("rzpFeeAnalytics")}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {t("rzpGross")}: ₹{(feeTotals.gross / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {t("rzpGatewayFees")}: ₹{(feeTotals.fees / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-200">
            {t("rzpNet")}: ₹{(feeTotals.net / 100).toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">{t("rzpFeeNote")}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-extrabold text-slate-900 dark:text-slate-100">
            {t("rzpPaymentTracking")}
          </p>
          <span className="rounded-full bg-[#0066ff]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0066ff]">
            {t("rzpLivePoll")}
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/50">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs dark:border-slate-700 dark:bg-slate-800/80">
                <th className="p-3 font-bold">{t("rzpColPayId")}</th>
                <th className="p-3 font-bold">{t("rzpColOrderId")}</th>
                <th className="p-3 font-bold">{t("colOrderId")}</th>
                <th className="p-3 font-bold">{t("colAmount")}</th>
                <th className="p-3 font-bold">{t("rzpColStatus")}</th>
                <th className="p-3 font-bold">{t("rzpColInvoice")}</th>
                <th className="p-3 font-bold">{t("rzpColAction")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {r.razorpayPaymentId ?? "—"}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {r.razorpayOrderId}
                  </td>
                  <td className="p-3 font-mono text-[11px]">{r.orderRef}</td>
                  <td className="p-3">
                    ₹{(r.amountPaise / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusBadgeClass(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {r.invoiceSent ? t("rzpInvoiceSent") : t("rzpInvoicePending")}
                  </td>
                  <td className="p-3">
                    {r.status === "captured" && r.razorpayPaymentId ? (
                      <button
                        type="button"
                        disabled={refundBusy === r.razorpayPaymentId}
                        onClick={() => void doRefund(r)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        {refundBusy === r.razorpayPaymentId
                          ? t("rzpRefunding")
                          : t("rzpRefund")}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="mb-2 font-extrabold text-slate-900 dark:text-slate-100">
          {t("rzpSettlementTitle")}
        </p>
        <p className="mb-3 text-xs text-slate-500">{t("rzpSettlementHint")}</p>
        <div className="space-y-2">
          {SETTLEMENT_ROWS.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/50"
            >
              <div>
                <p className="font-mono text-xs text-slate-500">UTR {s.utr}</p>
                <p className="text-xs text-slate-500">{s.at}</p>
              </div>
              <div className="text-right text-sm">
                <p>
                  {t("rzpSettlementGross")}: ₹
                  {(s.amount / 100).toLocaleString("en-IN")}
                </p>
                <p className="text-rose-600 dark:text-rose-400">
                  {t("rzpRzpFee")}: ₹{(s.fee / 100).toLocaleString("en-IN")}
                </p>
                <p className="font-bold text-emerald-700 dark:text-emerald-300">
                  {t("rzpBankCredit")}: ₹
                  {(s.net / 100).toLocaleString("en-IN")}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
