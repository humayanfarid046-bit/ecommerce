"use client";

import { Link } from "@/i18n/navigation";
import { MapPin, FileText, Truck, Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { appCard, appHeading, appSubhead } from "@/lib/app-inner-ui";

export function AccountLegalInformation() {
  const t = useTranslations("account");
  const tf = useTranslations("footer");

  return (
    <section className={`${appCard} rounded-[18px] p-5`}>
      <h2 className={appHeading}>{t("legalInformationTitle")}</h2>
      <p className={`${appSubhead} mt-1`}>{t("legalInformationBody")}</p>
      <div className="mt-4 flex gap-2 text-slate-700 dark:text-slate-200">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0066ff]" aria-hidden />
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {tf("footerSellerLegalName")}
          {"\n"}
          {tf("footerRegisteredAddress")}
        </p>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        <li>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-[#0066ff]/40 dark:border-white/[0.08] dark:bg-[#161d2b]/95 dark:text-slate-100"
          >
            <FileText className="h-3.5 w-3.5" />
            {tf("footerPrivacy")}
          </Link>
        </li>
        <li>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-[#0066ff]/40 dark:border-white/[0.08] dark:bg-[#161d2b]/95 dark:text-slate-100"
          >
            <FileText className="h-3.5 w-3.5" />
            {tf("footerTerms")}
          </Link>
        </li>
        <li>
          <Link
            href="/shipping"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-[#0066ff]/40 dark:border-white/[0.08] dark:bg-[#161d2b]/95 dark:text-slate-100"
          >
            <Truck className="h-3.5 w-3.5" />
            {tf("footerRefund")}
          </Link>
        </li>
        <li>
          <Link
            href="/cookies"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-[#0066ff]/40 dark:border-white/[0.08] dark:bg-[#161d2b]/95 dark:text-slate-100"
          >
            <Cookie className="h-3.5 w-3.5" />
            {tf("footerCookies")}
          </Link>
        </li>
      </ul>
    </section>
  );
}
