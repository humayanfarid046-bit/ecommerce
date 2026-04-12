"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  en: "EN",
  bn: "বাংলা",
};

type LangProps = { variant?: "default" | "onPrimary" };

export function LanguageSwitcher({ variant = "default" }: LangProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full p-0.5",
        variant === "onPrimary"
          ? "border border-white/30 bg-white/10"
          : "border border-slate-200/90 bg-[#F8F9FA] dark:border-slate-600 dark:bg-slate-800/90"
      )}
      role="navigation"
      aria-label="Language"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold transition",
            locale === loc
              ? variant === "onPrimary"
                ? "bg-white text-[#2874f0] shadow-sm"
                : "bg-[#0066ff] text-white shadow-sm"
              : variant === "onPrimary"
                ? "text-white/90 hover:text-white"
                : "text-slate-500 hover:text-[var(--electric)] dark:text-slate-400 dark:hover:text-[#7eb3ff]"
          )}
        >
          {labels[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
