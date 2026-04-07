"use client";

import { useTheme } from "@/context/theme-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";
import { Globe, Moon, Sun } from "lucide-react";

export function AppPreferencesSection() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("account");

  return (
    <section className="glass rounded-2xl border border-slate-200/80 p-6 dark:border-slate-700/80">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {t("appPreferencesTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("appPreferencesSubtitle")}
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t("themeLabel")}
          </p>
          <div className="mt-2 inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
                theme === "light"
                  ? "bg-white text-[#0066ff] shadow dark:bg-slate-800"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Sun className="h-4 w-4" />
              {t("themeLight")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
                theme === "dark"
                  ? "bg-slate-800 text-[#0066ff] shadow"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Moon className="h-4 w-4" />
              {t("themeDark")}
            </button>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Globe className="h-4 w-4" />
            {t("languageLabel")}
          </p>
          <div className="mt-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </section>
  );
}
