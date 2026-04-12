"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { appCard, gradientCta, innerPageShell } from "@/lib/app-inner-ui";

const accountLoadingShell =
  "mx-auto w-full min-w-0 max-w-7xl px-5 py-16 text-center text-text-primary sm:px-6";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const t = useTranslations("account");

  if (status === "loading") {
    return (
      <div
        className={`${accountLoadingShell} flex items-center justify-center bg-[#F8F9FA] text-text-secondary dark:bg-[#0c1019] dark:text-slate-200 sm:rounded-xl`}
      >
        <Loader2
          className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-400"
          aria-hidden
        />
        <span className="sr-only">{t("loadingAccount")}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`${innerPageShell} mx-auto w-full min-w-0 bg-[#F8F9FA] py-12 text-text-primary dark:bg-[#0c1019] dark:text-slate-100 sm:rounded-xl sm:py-16`}
      >
        <div className={`${appCard} rounded-[20px] p-6 text-center sm:p-8`}>
          <p className="text-text-secondary dark:text-slate-300">{t("signInPrompt")}</p>
          <Link
            href="/login"
            className={`${gradientCta} mt-4 inline-block px-6 py-2.5 text-sm font-bold`}
          >
            {t("loginSignup")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl bg-[#F8F9FA] px-4 py-4 text-text-primary dark:bg-[#0c1019] dark:text-slate-100 sm:rounded-xl md:px-4 md:py-4">
      <main className="min-w-0 w-full overflow-x-hidden pb-2">
        {children}
      </main>
    </div>
  );
}
