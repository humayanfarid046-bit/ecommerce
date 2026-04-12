"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShareButton } from "@/components/share-button";
import { LifeBuoy } from "lucide-react";

export function StoreShareBar() {
  const t = useTranslations("share");
  const tb = useTranslations("brand");

  return (
    <section className="mt-10 rounded-2xl border border-[#EEEEEE] bg-gradient-to-br from-white to-[#F8F9FA] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-slate-700/90 dark:from-[#151f2e] dark:to-[#0f1419] dark:shadow-none md:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-text-primary dark:text-slate-100">
            {t("storeShareTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary dark:text-slate-400">
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
            className="inline-flex items-center gap-2 rounded-xl border border-[#2563eb]/35 bg-[#2563eb]/10 px-4 py-2.5 text-sm font-bold text-[#2563eb] transition hover:bg-[#2563eb]/16 dark:border-[#3b82f6]/40 dark:bg-[#2563eb]/15 dark:text-[#93c5fd] dark:hover:bg-[#2563eb]/25"
          >
            <LifeBuoy className="h-4 w-4 shrink-0" />
            {t("getHelp")}
          </Link>
        </div>
      </div>
    </section>
  );
}
