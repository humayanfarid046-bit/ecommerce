"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";

export function AppPreferencesSection() {
  const t = useTranslations("account");

  return (
    <section className="glass rounded-[18px] border border-slate-200/80 p-6 dark:border-slate-700/80">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {t("appPreferencesTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("appPreferencesSubtitle")}
      </p>

      <div className="mt-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Globe className="h-4 w-4" />
          {t("languageLabel")}
        </p>
        <div className="mt-2">
          <LanguageSwitcher />
        </div>
      </div>
    </section>
  );
}
