"use client";

import { useTranslations } from "next-intl";
import {
  CreditCard,
  Landmark,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";

export function CheckoutOmnichannelBanner() {
  const t = useTranslations("checkout");
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-[#0066ff]/[0.04] px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-[#0066ff]/10">
      <p className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
        <Sparkles className="h-4 w-4 shrink-0 text-[#0066ff]" />
        {t("omnichannelTitle")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
          <Smartphone className="h-3 w-3 text-emerald-600" />
          Google Pay
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
          PhonePe
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
          <CreditCard className="h-3 w-3 text-indigo-600" />
          Cards
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
          <Landmark className="h-3 w-3 text-violet-600" />
          Net banking
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
          <Wallet className="h-3 w-3 text-amber-600" />
          Wallets
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {t("omnichannelSubtitle")}
      </p>
    </div>
  );
}

export function CheckoutWebOtpHint() {
  const t = useTranslations("checkout");
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
      {t("otpAutofillHint")}
    </div>
  );
}

export function CheckoutSavedCardsNote() {
  const t = useTranslations("checkout");
  return (
    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
      {t("savedCardsTokenHint")}
    </p>
  );
}
