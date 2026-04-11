"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { appCard, gradientCta, innerPageShell } from "@/lib/app-inner-ui";

const accountLoadingShell =
  "mx-auto w-full min-w-0 max-w-7xl px-5 py-16 text-center sm:px-6";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, signOut, status } = useAuth();
  const t = useTranslations("account");

  if (status === "loading") {
    return (
      <div
        className={`${accountLoadingShell} flex items-center justify-center bg-slate-50 text-slate-700 dark:bg-[#0c1019] dark:text-slate-200 sm:rounded-xl`}
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
        className={`${innerPageShell} mx-auto w-full min-w-0 bg-slate-50 py-12 text-slate-900 dark:bg-[#0c1019] dark:text-slate-100 sm:rounded-xl sm:py-16`}
      >
        <div className={`${appCard} rounded-[20px] p-6 text-center sm:p-8`}>
          <p className="text-slate-600 dark:text-slate-300">{t("signInPrompt")}</p>
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
    <div className="mx-auto w-full min-w-0 max-w-7xl bg-slate-50 px-3 py-6 text-slate-900 dark:bg-[#0c1019] dark:text-slate-100 sm:rounded-xl sm:px-4 md:px-6 md:py-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => signOut()}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-white/12 dark:bg-white/[0.06] dark:text-slate-100 dark:shadow-none dark:backdrop-blur-sm dark:hover:bg-white/[0.1]"
        >
          {t("signOut")}
        </button>
      </div>

      <main className="mt-6 min-w-0 w-full overflow-x-hidden pb-2 lg:mt-4">
        {children}
      </main>
    </div>
  );
}
