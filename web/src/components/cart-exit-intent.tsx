"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Tag } from "lucide-react";

const STORAGE_KEY = "libas_exit_offer_dismissed";

export function CartExitIntent() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("cart");

  const tryOpen = useCallback(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    function onLeave(e: MouseEvent) {
      if (e.clientY > 0) return;
      tryOpen();
    }
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => document.documentElement.removeEventListener("mouseleave", onLeave);
  }, [tryOpen]);

  function dismiss() {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="exit-offer-title"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            className="relative max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={t("exitOfferClose")}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0066ff]/15 text-[#0066ff]">
              <Tag className="h-6 w-6" />
            </div>
            <h2 id="exit-offer-title" className="mt-4 text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {t("exitOfferTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t("exitOfferBody")}
            </p>
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 font-mono text-sm font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              {t("exitOfferCode")}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-6 w-full rounded-2xl bg-[#0066ff] py-3 text-sm font-bold text-white transition hover:bg-[#0052cc]"
            >
              {t("exitOfferCta")}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
