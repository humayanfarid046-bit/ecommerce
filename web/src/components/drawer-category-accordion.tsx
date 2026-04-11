"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { categories } from "@/lib/storefront-catalog";
import { cn } from "@/lib/utils";

export function DrawerCategoryAccordion({ onPick }: { onPick: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const tc = useTranslations("categories");
  const ts = useTranslations("categorySub");

  return (
    <div className="space-y-2">
      {categories.map((c) => {
        const hasChildren = Boolean(c.children?.length);
        const expanded = openId === c.id;
        const title = tc(c.slug);
        if (!hasChildren) {
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              onClick={onPick}
              className="flex items-center gap-3 rounded-xl border border-[rgba(37,99,235,0.42)] bg-white px-3 py-3 text-sm font-bold text-slate-900 shadow-[0_4px_28px_rgba(37,99,235,0.05)] transition-colors hover:border-[#2563eb]/55 hover:bg-[#F0F7FF] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[rgba(37,99,235,0.35)] bg-white text-xl shadow-[0_2px_16px_rgba(37,99,235,0.05)] dark:border-slate-600 dark:bg-slate-800 dark:shadow-none"
                aria-hidden
              >
                {c.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{title}</span>
            </Link>
          );
        }
        return (
          <div
            key={c.id}
            className={cn(
              "overflow-hidden rounded-xl border border-[rgba(37,99,235,0.42)] bg-white shadow-[0_4px_28px_rgba(37,99,235,0.05)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-none",
              expanded && "ring-2 ring-[#2563eb]/40"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : c.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold text-slate-900 transition-colors hover:bg-[#F0F7FF] dark:text-slate-50 dark:hover:bg-slate-800/80"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[rgba(37,99,235,0.35)] bg-white text-xl shadow-[0_2px_16px_rgba(37,99,235,0.05)] dark:border-slate-600 dark:bg-slate-800 dark:shadow-none"
                aria-hidden
              >
                {c.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{title}</span>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {expanded ? "−" : "+"}
              </span>
            </button>
            {expanded ? (
              <div className="border-t border-[rgba(37,99,235,0.18)] bg-[#fafbff] px-2 py-2 dark:border-slate-600 dark:bg-slate-950/60">
                <Link
                  href={`/category/${c.slug}`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-bold text-[#2563eb] dark:text-[#7cb4ff]"
                  onClick={onPick}
                >
                  {tc("viewAllInCategory", { name: title })}
                </Link>
                {c.children!.map((ch) => (
                  <Link
                    key={ch.slug}
                    href={`/category/${c.slug}?sub=${ch.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-[#F0F7FF] dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={onPick}
                  >
                    {ts(ch.slug)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
