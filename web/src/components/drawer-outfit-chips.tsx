"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { OUTFIT_SEARCH_CHIPS } from "@/lib/outfit-search-chips";

export function DrawerOutfitChips({ onPick }: { onPick: () => void }) {
  const t = useTranslations("nav");

  return (
    <div className="border-t border-slate-200/80 bg-[#FFFFFF] px-3 pb-3 pt-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary dark:text-slate-300">
        {t("drawerShopByStyle")}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {OUTFIT_SEARCH_CHIPS.map(({ query, labelKey }) => (
          <Link
            key={query}
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onPick}
            className="shrink-0 rounded-full border border-slate-200/90 bg-[#F8F9FA] px-3 py-2 text-xs font-bold text-text-primary shadow-sm transition-colors hover:border-[#2563eb]/50 hover:bg-[#F0F7FF] hover:text-[#1e40af] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#5ab0ff] dark:hover:bg-[#2874f0]/20 dark:hover:text-slate-100"
          >
            {t(labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );
}
