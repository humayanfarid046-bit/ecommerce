"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
};

export function AccountSectionHeader({
  title,
  subtitle,
  backHref = "/account",
}: Props) {
  const t = useTranslations("account");
  const backLabel =
    backHref === "/account/settings" ? t("backToSettings") : t("backToAccount");

  return (
    <header className="mb-6 min-w-0 space-y-2">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] transition hover:text-[#1d4ed8] dark:text-[#7eb3ff] dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
        {backLabel}
      </Link>
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#e8edf5] sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}
