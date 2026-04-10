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
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:border-[#2874f0]/40 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xl dark:border-slate-600 dark:bg-slate-800"
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
              "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900",
              expanded && "ring-2 ring-[#2874f0]/35"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : c.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold text-slate-900 dark:text-slate-50"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xl dark:border-slate-600 dark:bg-slate-800"
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
              <div className="border-t border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-600 dark:bg-slate-950/60">
                <Link
                  href={`/category/${c.slug}`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-bold text-[#2874f0] dark:text-[#7cb4ff]"
                  onClick={onPick}
                >
                  {tc("viewAllInCategory", { name: title })}
                </Link>
                {c.children!.map((ch) => (
                  <Link
                    key={ch.slug}
                    href={`/category/${c.slug}?sub=${ch.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
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
