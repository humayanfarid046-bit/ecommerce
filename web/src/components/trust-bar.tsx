import { Lock, Shield, BadgeCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { STORE_SHELL } from "@/lib/store-layout";

/** Thin trust strip above the footer — safe payments + verified badges (monochrome). */
export async function TrustBar() {
  const t = await getTranslations("trustBar");

  return (
    <div className="border-t border-[#E5E7EB] bg-[#F5F7FA] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <div
        className={`${STORE_SHELL} py-2.5 md:py-3`}
        style={{ lineHeight: 1.6 }}
      >
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5E7EB] dark:bg-slate-800 dark:ring-slate-600"
              aria-hidden
            >
              <Lock className="h-4 w-4 text-[#2874f0]" strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t("safePayments")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
              {t("badgeSsl")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Shield className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
              {t("badgeSecure")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
              {t("badgeOriginal")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
