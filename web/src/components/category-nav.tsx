"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { categories } from "@/lib/storefront-catalog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { STORE_SHELL } from "@/lib/store-layout";

type NavProps = {
  flipkartStyle?: boolean;
  /** Horizontal circular icons — mobile storefront strip below header. */
  variant?: "default" | "mobileScroll";
};

export function CategoryNav({
  flipkartStyle = false,
  variant = "default",
}: NavProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const tc = useTranslations("categories");
  const ts = useTranslations("categorySub");

  if (variant === "mobileScroll") {
    return (
      <nav
        className="flex w-full gap-3 overflow-x-auto px-3 pb-2 pt-2 [scrollbar-width:none] sm:gap-4 sm:px-4 [&::-webkit-scrollbar]:hidden"
        aria-label={tc("ariaCategories")}
      >
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="flex w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1.5 sm:w-[4.75rem]"
          >
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl shadow-sm",
                "dark:border-slate-600 dark:bg-white"
              )}
              aria-hidden
            >
              {c.icon}
            </span>
            <span className="line-clamp-2 min-h-[2.25rem] w-full max-w-[4.75rem] text-center text-[10px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
              {tc(c.slug)}
            </span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={`${STORE_SHELL} flex flex-wrap items-center gap-0.5 py-2.5 md:gap-1`}
    >
      {categories.map((c) => (
        <div
          key={c.id}
          className="relative"
          onMouseEnter={() => setOpenId(c.id)}
          onMouseLeave={() => setOpenId(null)}
        >
          <Link
            href={`/category/${c.slug}`}
            className={cn(
              "flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold transition",
              flipkartStyle
                ? "text-slate-700 hover:bg-slate-100 hover:text-[#2874f0]"
                : "rounded-full text-slate-600 hover:bg-[#0066ff]/8 hover:text-[#0066ff]"
            )}
          >
            <span aria-hidden>{c.icon}</span>
            {tc(c.slug)}
            {c.children?.length ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            ) : null}
          </Link>
          <AnimatePresence>
            {openId === c.id && c.children?.length ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-2xl border border-slate-200/90",
                  "bg-white/95 p-2 shadow-[0_12px_40px_rgba(0,102,255,0.12)] backdrop-blur-xl"
                )}
              >
                {c.children.map((ch) => (
                  <Link
                    key={ch.slug}
                    href={`/category/${c.slug}?sub=${ch.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#0066ff]/8 hover:text-[#0066ff]"
                  >
                    {ts(ch.slug)}
                  </Link>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ))}
    </nav>
  );
}
