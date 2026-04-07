"use client";

import { useTranslations } from "next-intl";

export function PaymentMethodIcons() {
  const t = useTranslations("checkout");

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/50">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("paySecurely")}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span
          className="inline-flex h-8 items-center rounded-md bg-[#5f259f] px-2.5 text-[10px] font-extrabold text-white"
          title="UPI"
        >
          UPI
        </span>
        <span
          className="inline-flex h-8 items-center rounded-md bg-gradient-to-r from-[#1434cb] to-[#0066ff] px-2.5 text-[10px] font-bold text-white"
          title="Cards"
        >
          VISA
        </span>
        <span
          className="inline-flex h-8 items-center rounded-md bg-[#eb001b] px-2 text-[10px] font-bold text-white"
          title="Mastercard"
        >
          MC
        </span>
        <span
          className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2 text-[10px] font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          title="Net banking"
        >
          NetBank
        </span>
        <span
          className="inline-flex h-8 items-center rounded-md border border-dashed border-slate-300 px-2 text-[10px] font-bold text-slate-600 dark:border-slate-500 dark:text-slate-300"
          title="COD"
        >
          COD
        </span>
      </div>
    </div>
  );
}
