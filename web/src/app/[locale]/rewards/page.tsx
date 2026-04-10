"use client";

import { useTranslations } from "next-intl";
import { Gift } from "lucide-react";
import { RewardsHubContent } from "@/components/rewards-hub-content";
import { STORE_SHELL } from "@/lib/store-layout";

export default function RewardsPage() {
  const t = useTranslations("gamification");

  return (
    <div className={`${STORE_SHELL} pb-24 pt-6 sm:pb-8 md:pb-10`}>
      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#7c3aed] text-white shadow-lg shadow-[#0066ff]/25">
          <Gift className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("pageSubtitle")}
          </p>
        </div>
      </header>

      <div className="max-w-lg rounded-3xl border border-slate-200/90 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/50 sm:p-6">
        <RewardsHubContent />
      </div>
    </div>
  );
}
