"use client";

import { useTranslations } from "next-intl";
import type { WalletLedgerEntry } from "@/lib/wallet-storage";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

type Props = {
  entries: WalletLedgerEntry[];
};

export function WalletTransactionList({ entries }: Props) {
  const t = useTranslations("wallet");

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#fafafa] px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
        {t("noTransactions")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-slate-700">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#E5E7EB] bg-[#fafafa] dark:border-slate-700 dark:bg-slate-800/80">
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
              {t("colType")}
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
              {t("colDetails")}
            </th>
            <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
              {t("colDate")}
            </th>
            <th className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">
              {t("colAmount")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const credit = e.deltaPaise >= 0;
            return (
              <tr
                key={e.id}
                className="border-b border-[#E5E7EB]/80 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3">
                  <span
                    className={
                      credit
                        ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                        : "inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                    }
                  >
                    {credit ? (
                      <ArrowDownLeft className="h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    {credit ? t("credit") : t("debit")}
                  </span>
                </td>
                <td className="max-w-[240px] px-4 py-3 text-slate-700 dark:text-slate-300">
                  <p className="line-clamp-2 font-medium">{e.label}</p>
                  {e.orderId ? (
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {e.orderId}
                    </p>
                  ) : null}
                  {e.externalRef ? (
                    <p className="font-mono text-[10px] text-slate-400">
                      {e.externalRef}
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {new Date(e.at).toLocaleString()}
                </td>
                <td
                  className={
                    credit
                      ? "px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400"
                      : "px-4 py-3 text-right font-bold text-rose-700 dark:text-rose-400"
                  }
                >
                  {credit ? "+" : "−"}₹
                  {(Math.abs(e.deltaPaise) / 100).toLocaleString("en-IN", {
                    minimumFractionDigits: e.deltaPaise % 100 !== 0 ? 2 : 0,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
