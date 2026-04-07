"use client";

import { Link } from "@/i18n/navigation";
import { useCompare } from "@/context/compare-context";
import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";

export function CompareBar() {
  const { ids } = useCompare();
  const t = useTranslations("compare");

  if (ids.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-0 md:bottom-4 md:px-6">
      <div className="pointer-events-auto w-full max-w-lg rounded-t-2xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,102,255,0.14)] backdrop-blur-md dark:border-slate-600 dark:bg-slate-900/95 md:rounded-2xl md:shadow-[0_12px_40px_rgba(0,102,255,0.18)]">
      <div className="mx-auto flex max-w-none items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Scale className="h-5 w-5 text-[#0066ff]" />
          {t("barLabel", { count: ids.length })}
        </p>
        <Link
          href="/compare"
          className="rounded-xl bg-[#0066ff] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#0052cc]"
        >
          {t("openCompare")}
        </Link>
      </div>
      </div>
    </div>
  );
}
