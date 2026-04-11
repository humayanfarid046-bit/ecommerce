"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import { appCard, appSubhead } from "@/lib/app-inner-ui";
import { cn } from "@/lib/utils";

/** Personalized welcome + intro copy for Help page. */
export function HelpIntro() {
  const t = useTranslations("help");
  const { user } = useAuth();

  const firstName = useMemo(() => {
    const dn = user?.displayName?.trim();
    if (dn) return dn.split(/\s+/)[0] ?? dn;
    const em = user?.email?.split("@")[0];
    return em?.trim() ?? "";
  }, [user?.displayName, user?.email]);

  const lead = firstName
    ? t("welcomePersonalized", { name: firstName })
    : t("welcomeGeneric");

  return (
    <div
      className={cn(
        appCard,
        "mb-8 border-slate-100/90 bg-white/95 p-5 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-white/[0.08] dark:bg-[#161d2b]/95 dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)]"
      )}
    >
      <p className="text-[15px] font-medium leading-snug tracking-tight text-slate-900 dark:text-[#e8edf5]">
        {lead}
      </p>
      <p className={cn(appSubhead, "mt-3 text-[13px] leading-relaxed")}>{t("intro")}</p>
    </div>
  );
}
