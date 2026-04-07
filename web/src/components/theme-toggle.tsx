"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  /** Light icons on blue header */
  variant?: "default" | "onPrimary";
};

export function ThemeToggle({ variant = "default" }: Props) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("nav");

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={cn(
        "rounded-full p-2.5 transition",
        variant === "onPrimary"
          ? "text-white hover:bg-white/15"
          : "text-[var(--electric)] hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
      aria-label={t("themeToggle")}
      title={t("themeToggle")}
    >
      {theme === "dark" ? (
        <Sun className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
      ) : (
        <Moon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
      )}
    </button>
  );
}
