"use client";

import { useTranslations } from "next-intl";

const SEEDS = [301, 302, 303, 304, 305, 306];

export function InstagramFeed() {
  const t = useTranslations("home");

  return (
    <section className="border-t border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white py-5 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 md:py-6">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0066ff]">
            {t("instagramKicker")}
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-xl">
            {t("instagramTitle")}
          </h2>
          <p className="mt-1 max-w-lg text-xs leading-snug text-slate-600 dark:text-slate-400">
            {t("instagramSubtitle")}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:mt-5 md:gap-2 lg:grid-cols-6">
          {SEEDS.map((s) => (
            <a
              key={s}
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200/80 transition hover:ring-[#0066ff]/40 dark:bg-slate-800 dark:ring-slate-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/ig${s}/400/400`}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
