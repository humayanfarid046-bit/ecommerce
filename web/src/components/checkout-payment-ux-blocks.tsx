"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { BANK_OFFERS_DEMO } from "@/lib/payment-bank-offers";
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

export function CheckoutBankOffersRow({ payKey }: { payKey: string }) {
  const t = useTranslations("checkout");
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/25">
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900 dark:text-amber-100">
        {t("bankOffersTitle")}
      </p>
      <ul className="mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BANK_OFFERS_DEMO.map((o) => {
          const hot =
            (o.matchPayKey && payKey === o.matchPayKey) ||
            (o.matchCardPrefix && payKey.startsWith("card"));
          return (
            <li
              key={o.id}
              className={cn(
                "min-w-[200px] max-w-[240px] shrink-0 snap-start rounded-xl border px-3 py-2 text-xs transition",
                hot
                  ? "border-[#0066ff] bg-[#0066ff]/10 text-slate-900 dark:bg-[#0066ff]/15 dark:text-slate-100"
                  : "border-amber-200/90 bg-white/90 text-slate-700 dark:border-amber-800/50 dark:bg-slate-900/40 dark:text-slate-200"
              )}
            >
              <p className="font-bold text-amber-950 dark:text-amber-100">
                {o.title}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                {o.detail}
              </p>
            </li>
          );
        })}
      </ul>
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
