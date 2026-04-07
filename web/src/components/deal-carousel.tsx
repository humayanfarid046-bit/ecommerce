"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SLIDE_GRADIENTS = [
  "bg-gradient-to-br from-[#0066ff] via-[#7c3aed] to-[#c4b5fd]",
  "bg-gradient-to-tr from-[#0891b2] via-[#6366f1] to-[#e879f9]",
  "bg-gradient-to-br from-[#2563eb] via-[#8b5cf6] to-[#f472b6]",
] as const;

export function DealCarousel() {
  const t = useTranslations("dealCarousel");
  const [i, setI] = useState(0);
  const n = SLIDE_GRADIENTS.length;

  const badges = [t("slide1Badge"), t("slide2Badge"), t("slide3Badge")];
  const titles = [t("slide1Title"), t("slide2Title"), t("slide3Title")];
  const subtitles = [
    t("slide1Subtitle"),
    t("slide2Subtitle"),
    t("slide3Subtitle"),
  ];

  const next = useCallback(() => setI((v) => (v + 1) % n), [n]);
  const prev = useCallback(() => setI((v) => (v - 1 + n) % n), [n]);

  useEffect(() => {
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section
      className="relative h-[min(100svh,900px)] min-h-[520px] w-full overflow-hidden"
      aria-roledescription="carousel"
      aria-label={t("ariaLabel")}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className={cn(
            "pointer-events-none absolute inset-0",
            SLIDE_GRADIENTS[i],
            "before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,255,255,0.35),transparent)]"
          )}
        />
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.12)%22/%3E%3C/svg%3E')] opacity-40" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-16 pt-8 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {badges[i]}
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-[1.05]">
              {titles[i]}
            </h1>
            <p className="mt-4 text-lg font-semibold text-white/90 md:text-xl">
              {subtitles[i]}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/search"
                className="pointer-events-auto inline-flex min-w-[160px] items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-[#0066ff] shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] active:scale-[0.98]"
              >
                {t("buyNow")}
              </Link>
              <Link
                href="/category/mens-wear"
                className="pointer-events-auto inline-flex min-w-[160px] items-center justify-center rounded-2xl border-2 border-white/50 bg-white/10 px-8 py-3.5 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {t("seeDeals")}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25 md:left-6"
        aria-label={t("prev")}
      >
        <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/25 md:right-6"
        aria-label={t("next")}
      >
        <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
      </button>

      <div
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2"
        role="tablist"
      >
        {SLIDE_GRADIENTS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={i === idx}
            onClick={() => setI(idx)}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              i === idx
                ? "w-10 bg-white shadow-[0_0_16px_rgba(255,255,255,0.8)]"
                : "w-2.5 bg-white/40 hover:bg-white/60"
            )}
            aria-label={t("goToSlide", { n: idx + 1 })}
          />
        ))}
      </div>
    </section>
  );
}
