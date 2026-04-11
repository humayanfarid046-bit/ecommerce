"use client";

import { useTranslations } from "next-intl";
import { Gift } from "lucide-react";
import { RewardsHubContent } from "@/components/rewards-hub-content";
import { innerPageShell, appCard, appSubhead, appHeading, sectionLabel } from "@/lib/app-inner-ui";

export default function RewardsPage() {
  const t = useTranslations("gamification");

  return (
    <div className={`${innerPageShell} min-h-[60vh]`}>
      <header className={appCard + " mb-6 flex items-start gap-4 p-5"}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] via-[#5b21b6] to-[#0891b2] text-white shadow-lg shadow-[#0066ff]/20 ring-1 ring-white/10"
          aria-hidden
        >
          <Gift className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className={sectionLabel}>{t("title")}</p>
          <h1 className={`mt-1 ${appHeading} text-xl sm:text-[1.35rem]`}>
            {t("pageTitle")}
          </h1>
          <p className={`mt-2 max-w-md ${appSubhead} text-[13px]`}>
            {t("pageSubtitle")}
          </p>
        </div>
      </header>

      <RewardsHubContent />
    </div>
  );
}
