import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { STORE_SHELL } from "@/lib/store-layout";

/** Thin trust strip above the footer — safe payments + verified badges (monochrome). */
export async function TrustBar() {
  const t = await getTranslations("trustBar");

  return (
    <div className="border-t border-[#E5E7EB] bg-[#F5F7FA] text-slate-700 dark:border-slate-800 dark:bg-[#121a2a] dark:text-slate-200">
      <div
        className={`${STORE_SHELL} py-2.5 md:py-3`}
        style={{ lineHeight: 1.6 }}
      >
        <div className="flex items-center justify-center gap-2.5 sm:justify-start">
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
      </div>
    </div>
  );
}
