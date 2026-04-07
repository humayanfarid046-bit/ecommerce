"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  aggregateWalletAnalytics,
  creditWalletPaise,
  debitWalletPaise,
  getWallet,
  listWalletStorageKeys,
} from "@/lib/wallet-storage";
import {
  getWalletGlobalSettings,
  saveWalletGlobalSettings,
  type WalletGlobalSettings,
} from "@/lib/wallet-settings";
import { Wallet, TrendingUp, TrendingDown, Shield } from "lucide-react";

export function AdminWalletPanel() {
  const t = useTranslations("admin.wallet");
  const [settings, setSettings] = useState<WalletGlobalSettings>(() =>
    getWalletGlobalSettings()
  );
  const [uid, setUid] = useState("guest");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [keys, setKeys] = useState<string[]>([]);
  const [agg, setAgg] = useState(() => aggregateWalletAnalytics());

  function refresh() {
    setKeys(listWalletStorageKeys());
    setAgg(aggregateWalletAnalytics());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("lc-wallet", refresh);
    return () => window.removeEventListener("lc-wallet", refresh);
  }, []);

  function persist(next: WalletGlobalSettings) {
    saveWalletGlobalSettings(next);
    setSettings(next);
  }

  function manualCredit() {
    const n = Number(amount.replace(/\D/g, ""));
    if (!n || n <= 0 || !reason.trim()) return;
    creditWalletPaise(uid, n * 100, `Admin credit: ${reason}`, {
      kind: "admin_credit",
    });
    setAmount("");
    setReason("");
    refresh();
  }

  function manualDebit() {
    const n = Number(amount.replace(/\D/g, ""));
    if (!n || n <= 0 || !reason.trim()) return;
    const ok = debitWalletPaise(uid, n * 100, `Admin debit: ${reason}`, {
      kind: "admin_debit",
    });
    if (!ok) {
      alert(t("debitInsufficient"));
      return;
    }
    setAmount("");
    setReason("");
    refresh();
  }

  const preview = getWallet(uid);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
            <Wallet className="h-5 w-5 text-[#2874f0]" />
            {t("title")}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {t("analyticsRecharge")}
            </p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              ₹{(agg.rechargeCreditsPaise / 100).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-8 w-8 text-rose-600" />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {t("analyticsSpend")}
            </p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              ₹{(agg.orderDebitsPaise / 100).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-violet-600" />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {t("analyticsEntries")}
            </p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {agg.entryCount}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {t("globalSettings")}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.walletPaymentsEnabled}
            onChange={(e) =>
              persist({ ...settings, walletPaymentsEnabled: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          {t("toggleCheckoutWallet")}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.walletTopUpEnabled}
            onChange={(e) =>
              persist({ ...settings, walletTopUpEnabled: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          {t("toggleTopUp")}
        </label>
        <label className="block text-sm">
          {t("maxRechargeRupees")}
          <input
            type="number"
            min={100}
            value={Math.floor(settings.maxRechargePaise / 100)}
            onChange={(e) =>
              persist({
                ...settings,
                maxRechargePaise: Math.max(100, Number(e.target.value) || 0) * 100,
              })
            }
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="text-xs font-bold uppercase text-amber-900 dark:text-amber-200">
          {t("manualAdjust")}
        </p>
        <label className="block text-sm">
          {t("targetUserId")}
          <select
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="guest">guest</option>
            {keys.map((k) => {
              const id = k.replace("lc_wallet_v3_", "");
              return (
                <option key={k} value={id}>
                  {id}
                </option>
              );
            })}
          </select>
        </label>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {t("currentBalance")}: ₹
          {(preview.balancePaise / 100).toLocaleString("en-IN")}
        </p>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("amountPlaceholder")}
          className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reasonPlaceholder")}
          className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={manualCredit}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            {t("creditBtn")}
          </button>
          <button
            type="button"
            onClick={manualDebit}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white"
          >
            {t("debitBtn")}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase text-slate-500">
          {t("auditHint")}
        </p>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2">{t("colUid")}</th>
                <th className="p-2">{t("colBalance")}</th>
              </tr>
            </thead>
            <tbody>
              {["guest", ...keys.map((k) => k.replace("lc_wallet_v3_", ""))]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((id) => {
                  const w = getWallet(id);
                  return (
                    <tr key={id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-2 font-mono">{id}</td>
                      <td className="p-2">
                        ₹{(w.balancePaise / 100).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
