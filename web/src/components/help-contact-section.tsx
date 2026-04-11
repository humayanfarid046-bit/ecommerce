"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fetchStorefrontContact,
  whatsappHref,
} from "@/lib/storefront-contact-client";
import { cn } from "@/lib/utils";
import {
  appCard,
  pressable,
  sectionLabel,
  appSubhead,
} from "@/lib/app-inner-ui";

export function HelpContactSection() {
  const t = useTranslations("help");
  const waPreset = useMemo(() => t("whatsappPreset"), [t]);
  const [loading, setLoading] = useState(true);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [waHref, setWaHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const c = await fetchStorefrontContact();
      if (cancelled) return;
      setPhoneDigits(c.supportPhoneE164.replace(/\D/g, ""));
      setEmail(c.supportEmail.trim());
      const w = c.whatsappE164.replace(/\D/g, "");
      setWaHref(w ? whatsappHref(c, waPreset) : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [waPreset]);

  const telHref = phoneDigits ? `tel:+${phoneDigits}` : null;
  const mailHref = email.length > 0 ? `mailto:${encodeURIComponent(email)}` : null;
  const hasContactChannel = Boolean(telHref || mailHref);
  const showContactNote = !loading && !hasContactChannel && !waHref;

  const tileRow = (href: string, icon: ReactNode, label: string, external?: boolean) => (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "flex min-h-[52px] items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-medium text-slate-800 transition-colors dark:text-[#e8edf5]",
        "border border-transparent bg-slate-50/80 hover:border-slate-200/90 hover:bg-white dark:bg-white/[0.04] dark:hover:border-white/10 dark:hover:bg-white/[0.06]",
        pressable
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0066ff] dark:bg-white/5 dark:text-[#7cb4ff]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 opacity-80 dark:text-slate-500" />
    </a>
  );

  return (
    <section id="contact" className="scroll-mt-24">
      <p className={sectionLabel}>{t("contactHeading")}</p>

      {loading ? (
        <div
          className={cn(
            "mt-4 animate-pulse space-y-3 p-6",
            appCard,
            "border-slate-100/90 dark:border-white/[0.07]"
          )}
        >
          <div className="h-3 w-2/3 rounded-lg bg-slate-200/80 dark:bg-white/10" />
          <div className="h-12 rounded-2xl bg-slate-100/90 dark:bg-white/5" />
          <div className="h-12 rounded-2xl bg-slate-100/90 dark:bg-white/5" />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Contact: call + email tiles */}
          <div
            className={cn(
              appCard,
              "border-slate-100/90 bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.06)] dark:border-white/[0.07] dark:bg-[#161d2b] dark:shadow-[0_12px_48px_rgba(0,0,0,0.42)] sm:p-5"
            )}
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400/90">
              {t("contactUsCard")}
            </p>
            <div className="space-y-1.5">
              {telHref
                ? tileRow(telHref, <Phone className="h-4 w-4" strokeWidth={2} />, t("callUs"))
                : null}
              {mailHref
                ? tileRow(mailHref, <Mail className="h-4 w-4" strokeWidth={2} />, t("emailUs"))
                : null}
              {!hasContactChannel ? (
                <p className={cn(appSubhead, "px-1 py-2 text-[12px]")}>{t("contactMissing")}</p>
              ) : null}
            </div>
          </div>

          {/* WhatsApp — separate floating card */}
          {waHref ? (
            <div
              className={cn(
                appCard,
                "border-emerald-500/15 bg-gradient-to-br from-emerald-50/95 to-white p-4 shadow-[0_2px_20px_rgba(16,185,129,0.08)] dark:border-emerald-500/20 dark:from-emerald-950/50 dark:to-[#161d2b] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-5"
              )}
            >
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800/80 dark:text-emerald-300/90">
                {t("whatsappCard")}
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex min-h-[52px] items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-[13px] font-semibold text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-50",
                  pressable
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200">
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 leading-snug">{t("whatsapp")}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-emerald-700/80 dark:text-emerald-300/90" />
              </a>
            </div>
          ) : (
            <div
              className={cn(
                appCard,
                "border-slate-100/90 p-4 dark:border-white/[0.07] dark:bg-[#161d2b] sm:p-5"
              )}
            >
              <p className={cn(appSubhead, "text-[12px]")}>{t("whatsappMissing")}</p>
            </div>
          )}
        </div>
      )}

      {showContactNote ? (
        <p className={cn(appSubhead, "mt-4 px-0.5 text-[12px]")}>{t("contactConfigureHint")}</p>
      ) : null}
    </section>
  );
}
