"use client";

import { useState, useEffect } from "react";
import { Gift, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { RewardsHubContent } from "@/components/rewards-hub-content";

export function EngagementHub() {
  const t = useTranslations("gamification");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const openFromMenu = () => setOpen(true);
    window.addEventListener("lc-open-engagement-hub", openFromMenu);
    return () => window.removeEventListener("lc-open-engagement-hub", openFromMenu);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 z-[60] hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0066ff] to-[#7c3aed] text-white shadow-[0_8px_32px_rgba(0,102,255,0.45)] transition hover:scale-105 md:bottom-32 md:flex"
        aria-label={t("openFab")}
      >
        <Gift className="h-6 w-6" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2">
              <RewardsHubContent />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
