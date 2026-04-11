"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageCircle,
  X,
  ChevronRight,
  Package,
  RefreshCw,
  MapPin,
  LifeBuoy,
  MessageCircle as WaIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchStorefrontContact,
  whatsappHref,
} from "@/lib/storefront-contact-client";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { pressable, sectionLabel } from "@/lib/app-inner-ui";

const FAQ_KEYS = ["q1", "q2", "q3"] as const;
const FAQ_ICONS = [Package, RefreshCw, MapPin] as const;

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("chat");
  const { user } = useAuth();
  const [waHref, setWaHref] = useState("https://wa.me/");

  const displayName = useMemo(() => {
    const dn = user?.displayName?.trim();
    if (dn) return dn.split(/\s+/)[0] ?? dn;
    const em = user?.email?.split("@")[0];
    return em?.trim() || "";
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const c = await fetchStorefrontContact();
      if (cancelled) return;
      setWaHref(whatsappHref(c, "Hi — I need help with my order."));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("lc-open-support-chat", fn);
    return () => window.removeEventListener("lc-open-support-chat", fn);
  }, []);

  const greeting = displayName
    ? t("greetingPersonalized", { name: displayName })
    : t("greetingGeneric");

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={cn(
          "fixed bottom-5 right-5 z-[60] hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0066ff] via-[#5b21b6] to-[#0891b2] text-white shadow-[0_10px_40px_rgba(0,102,255,0.45)] transition hover:brightness-110 md:bottom-8 md:right-8 md:flex",
          pressable
        )}
        aria-label={t("openChat")}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed bottom-24 right-5 z-[60] w-[min(100vw-2.5rem,400px)] overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/75 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl dark:bg-slate-950/80 md:bottom-28 md:right-8 md:w-[min(100vw-3rem,400px)]"
            role="dialog"
            aria-labelledby="support-chat-title"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0066ff]/90 via-[#4f46e5]/85 to-[#0e7490]/90 px-4 py-3.5 text-white backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <h2 id="support-chat-title" className="text-[15px] font-semibold tracking-tight">
                  {t("title")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn("rounded-xl p-2 hover:bg-white/10", pressable)}
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[min(72vh,440px)] space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/95 to-white p-4 dark:from-[#0c1019] dark:to-[#0f1419]">
              <div
                className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3.5 text-[13px] leading-relaxed text-slate-700 shadow-sm dark:border-white/[0.08] dark:bg-[#161d2b]/85 dark:text-[#e2e8f0]"
                style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.06)" }}
              >
                {greeting}
              </div>

              <div>
                <p className={cn(sectionLabel, "mb-2.5 px-0.5")}>{t("faqHeading")}</p>
                <div className="space-y-2">
                  {FAQ_KEYS.map((key, i) => {
                    const Icon = FAQ_ICONS[i] ?? Package;
                    return (
                      <details
                        key={key}
                        className={cn(
                          "group overflow-hidden rounded-2xl border border-slate-200/70 bg-white open:shadow-md dark:border-white/[0.06] dark:bg-[#161d2b]",
                          pressable
                        )}
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3.5 text-[13px] font-medium text-slate-800 [&::-webkit-details-marker]:hidden dark:text-[#e8edf5]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0066ff] dark:bg-white/5 dark:text-[#7cb4ff]">
                            <Icon className="h-4 w-4" strokeWidth={2} />
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">{t(`faq.${key}.q`)}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90 dark:text-slate-500" />
                        </summary>
                        <p className="border-t border-slate-100 px-3.5 pb-3.5 pl-[3.25rem] pt-2 text-[12px] leading-relaxed text-slate-600 dark:border-white/[0.06] dark:text-slate-300/90">
                          {t(`faq.${key}.a`)}
                        </p>
                      </details>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={cn(sectionLabel, "mb-2.5 px-0.5")}>{t("moreHeading")}</p>
                <div className="space-y-2">
                  <Link
                    href="/help"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3.5 text-left text-[13px] font-medium text-slate-800 shadow-sm dark:border-white/[0.06] dark:bg-[#161d2b] dark:text-[#e8edf5]",
                      pressable
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff]/15 to-[#5b21b6]/10 text-[#0066ff] dark:from-[#0066ff]/20 dark:to-[#5b21b6]/15 dark:text-[#93c5fd]">
                      <LifeBuoy className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">{t("helpCenter")}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  </Link>

                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-50/90 px-3.5 py-3.5 text-left text-[13px] font-medium text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-100",
                      pressable
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <WaIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">{t("whatsappLink")}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600/80 dark:text-emerald-400/80" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
