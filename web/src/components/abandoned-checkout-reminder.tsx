"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/cart-context";
import {
  shouldShowAbandonReminder,
  markReminderShownForCurrentAbandon,
} from "@/lib/checkout-recovery";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageCircle, X } from "lucide-react";

export function AbandonedCheckoutReminder() {
  const pathname = usePathname();
  const { items } = useCart();
  const t = useTranslations("checkout");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (pathname?.includes("/checkout")) return;
      if (items.length === 0) return;
      if (shouldShowAbandonReminder()) {
        setShow(true);
        markReminderShownForCurrentAbandon();
      }
    };
    const id = window.setInterval(tick, 45_000);
    tick();
    return () => window.clearInterval(id);
  }, [pathname, items.length]);

  if (!show) return null;

  const wa = `https://wa.me/?text=${encodeURIComponent(t("abandonWaText"))}`;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[#0066ff]/25 bg-white p-4 shadow-[0_16px_48px_rgba(0,102,255,0.2)] dark:border-slate-600 dark:bg-slate-900 md:left-auto"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff]">
        <MessageCircle className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("abandonTitle")}
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {t("abandonBody")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/checkout"
            className="inline-flex rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0052cc]"
          >
            {t("abandonCta")}
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
          >
            WhatsApp
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="shrink-0 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
