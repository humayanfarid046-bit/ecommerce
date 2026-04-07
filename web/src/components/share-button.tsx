"use client";

import { useCallback, useState } from "react";
import { Share2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  /** When omitted, uses the current page URL in the browser. */
  url?: string;
  title: string;
  text?: string;
  className?: string;
  variant?: "icon" | "pill";
};

export function ShareButton({
  url,
  title,
  text,
  className,
  variant = "pill",
}: Props) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  const run = useCallback(async () => {
    const target =
      url?.trim() ||
      (typeof window !== "undefined" ? window.location.href : "");
    if (!target) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title,
          text: text ?? title,
          url: target,
        });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.alert(t("copyFailed"));
    }
  }, [title, text, url, t]);

  return (
    <button
      type="button"
      onClick={() => void run()}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        variant === "pill" ? "px-4 py-2.5" : "h-10 w-10 p-0",
        className
      )}
      aria-label={t("shareAria")}
    >
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Share2 className="h-4 w-4 shrink-0" strokeWidth={2} />
      )}
      {variant === "pill" ? (
        <span>{copied ? t("copied") : t("share")}</span>
      ) : null}
    </button>
  );
}
