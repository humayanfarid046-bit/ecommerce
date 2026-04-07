"use client";

import { useState } from "react";
import { MessageCircle, X, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_KEYS = ["q1", "q2", "q3"] as const;

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("chat");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#0066ff] text-white shadow-[0_8px_32px_rgba(0,102,255,0.45)] transition hover:bg-[#0052cc] md:bottom-8 md:right-8"
        aria-label={t("openChat")}
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed bottom-24 right-5 z-[60] w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-900 md:bottom-28 md:right-8"
            role="dialog"
            aria-labelledby="support-chat-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#0066ff] to-[#5b21b6] px-4 py-3 text-white">
              <h2 id="support-chat-title" className="text-sm font-extrabold">
                {t("title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-white/10"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[min(70vh,420px)] space-y-3 overflow-y-auto p-4">
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {t("botGreeting")}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("faqHeading")}
                </p>
                {FAQ_KEYS.map((key) => (
                  <details
                    key={key}
                    className="group rounded-xl border border-slate-200 bg-slate-50/80 open:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:open:bg-slate-800"
                  >
                    <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                      {t(`faq.${key}.q`)}
                    </summary>
                    <p className="border-t border-slate-100 px-3 pb-2 pt-1 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {t(`faq.${key}.a`)}
                    </p>
                  </details>
                ))}
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <Link
                  href="/help"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0066ff]/30 bg-[#0066ff]/5 py-2.5 text-sm font-bold text-[#0066ff] transition hover:bg-[#0066ff]/10"
                  onClick={() => setOpen(false)}
                >
                  {t("helpCenter")}
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-xs font-semibold text-emerald-700 underline dark:text-emerald-400"
                >
                  {t("whatsappLink")}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
