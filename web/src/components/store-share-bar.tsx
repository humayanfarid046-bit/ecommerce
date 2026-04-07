"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShareButton } from "@/components/share-button";
import { LifeBuoy } from "lucide-react";

export function StoreShareBar() {
  const t = useTranslations("share");
  const tb = useTranslations("brand");

  return (
    <section className="mt-10 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950/80 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {t("storeShareTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {t("storeShareHint")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <ShareButton
            title={tb("name")}
            text={t("storeShareText", { name: tb("name") })}
          />
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-xl border border-[#0066ff]/30 bg-[#0066ff]/10 px-4 py-2.5 text-sm font-bold text-[#0066ff] transition hover:bg-[#0066ff]/15 dark:text-[#60a5fa]"
          >
            <LifeBuoy className="h-4 w-4 shrink-0" />
            {t("getHelp")}
          </Link>
        </div>
      </div>
    </section>
  );
}
