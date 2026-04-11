"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  variant?: "processing" | "success" | "failed";
  onDismiss?: () => void;
  onRetryUpi?: () => void;
  onRetryCard?: () => void;
  onRetryNet?: () => void;
};

export function CheckoutProcessingOverlay({
  open,
  variant = "processing",
  onDismiss,
  onRetryUpi,
  onRetryCard,
  onRetryNet,
}: Props) {
  const t = useTranslations("checkout");

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-busy={variant === "processing"}
      aria-label={t("processingTitle")}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-[18px] border border-white/20 bg-white p-8 shadow-2xl dark:border-slate-600 dark:bg-slate-900"
      >
        {variant === "processing" ? (
          <>
            <div className="mx-auto h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0066ff] via-violet-500 to-[#0066ff]"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
                style={{ width: "45%" }}
              />
            </div>
            <p className="mt-6 text-center text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("processingTitle")}
            </p>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
              {t("processingSubtitle")}
            </p>
            <div className="mt-6 space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        ) : variant === "failed" ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <span className="text-2xl font-bold">!</span>
            </div>
            <p className="mt-4 text-center text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("paymentFailedTitle")}
            </p>
            <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
              {t("paymentFailedRefund")}
            </p>
            <p className="mt-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("paymentRetryPick")}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {onRetryUpi ? (
                <button
                  type="button"
                  onClick={onRetryUpi}
                  className="rounded-[12px] border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t("retryWithUpi")}
                </button>
              ) : null}
              {onRetryCard ? (
                <button
                  type="button"
                  onClick={onRetryCard}
                  className="rounded-[12px] border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t("retryWithCard")}
                </button>
              ) : null}
              {onRetryNet ? (
                <button
                  type="button"
                  onClick={onRetryNet}
                  className="rounded-[12px] border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t("retryWithNetbanking")}
                </button>
              ) : null}
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="mt-4 w-full rounded-[12px] border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {t("paymentFailClose")}
              </button>
            ) : null}
          </>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
