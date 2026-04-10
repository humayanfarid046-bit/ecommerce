"use client";

import { Link } from "@/i18n/navigation";
import { categories } from "@/lib/product-model";
import { OUTFIT_SEARCH_CHIPS } from "@/lib/outfit-search-chips";
import { useTranslations } from "next-intl";

/**
 * Mobile home only: horizontal category pills + outfit keywords on gradient.
 * Categories come from `categories` (admin/catalog taxonomy); outfit chips from `outfit-search-chips`.
 */
export function HomeMobileLandingPills() {
  const tc = useTranslations("categories");
  const tNav = useTranslations("nav");
  const tHome = useTranslations("home");

  return (
    <section
      className="md:hidden"
      aria-label={tHome("mobilePillStripAria")}
    >
      <div className="bg-gradient-to-br from-[#1d4ed8] via-[#7c3aed] to-[#a21caf] px-0 py-2 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
        <div
          className="overflow-x-auto overscroll-x-contain px-3 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max min-w-full snap-x snap-mandatory gap-3.5 pb-0.5 pt-0.5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="flex w-[4rem] shrink-0 snap-start flex-col items-center gap-1.5 sm:w-[4.25rem]"
              >
                <span
                  className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-white text-[1.35rem] shadow-[0_2px_8px_rgba(0,0,0,0.12)] ring-1 ring-white/80"
                  aria-hidden
                >
                  {c.icon}
                </span>
                <span className="max-w-[4.5rem] text-center text-[10px] font-semibold leading-[1.15] text-white drop-shadow-sm">
                  {tc(c.slug)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-1.5 px-3 pb-0.5 pt-0.5">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] font-medium leading-snug tracking-wide text-white/95">
            {OUTFIT_SEARCH_CHIPS.map(({ query, labelKey }) => (
              <Link
                key={query}
                href={`/search?q=${encodeURIComponent(query)}`}
                className="transition hover:text-white hover:underline"
              >
                {tNav(labelKey)}
              </Link>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
