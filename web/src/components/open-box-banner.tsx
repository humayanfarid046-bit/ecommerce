"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function OpenBoxBanner() {
  const t = useTranslations("product.trust");

  return (
    <div className="flex gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div>
        <p className="font-bold">{t("openBoxTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed opacity-90">{t("openBoxDesc")}</p>
      </div>
    </div>
  );
}
