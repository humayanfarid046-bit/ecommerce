"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fetchStorefrontContact,
  whatsappHref,
} from "@/lib/storefront-contact-client";

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

  return (
    <section
      id="contact"
      className="scroll-mt-24 mt-12 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/[0.06] p-6 dark:border-[#0066ff]/30 dark:bg-[#0066ff]/10"
    >
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        {t("contactHeading")}
      </h2>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800/80">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#0066ff] dark:bg-slate-700">
                  <Phone className="h-4 w-4" />
                </span>
                {t("contactUsCard")}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {telHref ? (
                  <a
                    href={telHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-[#0066ff]" />
                    {t("callUs")}
                  </a>
                ) : null}
                {mailHref ? (
                  <a
                    href={mailHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-[#0066ff]" />
                    {t("emailUs")}
                  </a>
                ) : null}
                {!hasContactChannel ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("contactMissing")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <MessageCircle className="h-4 w-4" />
                </span>
                {t("whatsappCard")}
              </div>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("whatsapp")}
                </a>
              ) : (
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  {t("whatsappMissing")}
                </p>
              )}
            </div>
          </div>
          {showContactNote ? (
            <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
              {t("contactConfigureHint")}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
