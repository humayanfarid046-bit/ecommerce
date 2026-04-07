"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SearchFilters } from "@/components/search-filters";
import { ActiveFilterPills } from "@/components/active-filter-pills";

type Props = {
  children: React.ReactNode;
  maxPriceDefault: number;
  basePath: string;
  subLabel?: string | null;
};

export function FilterListingShell({
  children,
  maxPriceDefault,
  basePath,
  subLabel,
}: Props) {
  const t = useTranslations("filters");
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="w-full min-w-0 pb-4 md:pb-0">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm sm:inline-flex",
              "transition hover:border-[#0066ff]/35 hover:bg-[#0066ff]/5 hover:text-[#0066ff] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} />
            {t("openFilters")}
          </button>
        </div>
        <div className="min-w-0 flex-1 sm:flex sm:justify-end">
          <ActiveFilterPills basePath={basePath} subLabel={subLabel} />
        </div>
      </div>

      {children}

      {/* Overlay */}
      <div
        role="presentation"
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] transition-opacity duration-300",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(100vw-1rem,420px)] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-r dark:border-slate-700 dark:bg-slate-950",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!open}
        id="filter-drawer"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label={t("closeFilters")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
          <SearchFilters
            key={sp.toString()}
            maxPriceDefault={maxPriceDefault}
            basePath={basePath}
            embedded
            onApplied={() => setOpen(false)}
          />
        </div>
      </aside>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 left-1/2 z-[58] flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#0066ff]/30 bg-[#0066ff] px-5 py-3 text-sm font-extrabold text-white shadow-[0_8px_32px_rgba(0,102,255,0.45)]",
          "transition hover:bg-[#0052cc] md:hidden"
        )}
        aria-expanded={open}
        aria-controls="filter-drawer"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={2.5} />
        {t("openFilters")}
      </button>
    </div>
  );
}
