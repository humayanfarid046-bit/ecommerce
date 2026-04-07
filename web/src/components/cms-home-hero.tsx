"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  activeBannersNow,
  getCms,
  resolveBannerHref,
  type CmsBannerSlide,
} from "@/lib/cms-storage";
import { DealCarousel } from "@/components/deal-carousel";
import { cn } from "@/lib/utils";

function CmsSlides({ slides }: { slides: CmsBannerSlide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (!n) return;
    const id = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(id);
  }, [n]);

  if (!n) return null;

  const s = slides[i]!;
  const href = resolveBannerHref(s);
  const mobile = s.mobileUrl.trim() || s.desktopUrl;
  const desktop = s.desktopUrl.trim() || s.mobileUrl;

  return (
    <section
      className="relative h-[min(92svh,820px)] min-h-[420px] w-full overflow-hidden md:min-h-[520px]"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id + i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none absolute inset-0"
        >
          <Link href={href} className="pointer-events-auto absolute inset-0 z-0 block">
            <picture className="block h-full w-full">
              <source media="(max-width: 767px)" srcSet={mobile} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={desktop}
                alt=""
                className="h-full w-full object-cover object-center"
              />
            </picture>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-2 px-4">
        {slides.map((_, j) => (
          <button
            key={j}
            type="button"
            onClick={() => setI(j)}
            className={cn(
              "h-2 rounded-full transition-all",
              j === i ? "w-8 bg-white" : "w-2 bg-white/50"
            )}
            aria-label={`Slide ${j + 1}`}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 md:left-8">
        <button
          type="button"
          onClick={() => setI((v) => (v - 1 + n) % n)}
          className="pointer-events-auto rounded-full bg-black/35 p-2 text-white backdrop-blur-md"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      <div className="pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 md:right-8">
        <button
          type="button"
          onClick={() => setI((v) => (v + 1) % n)}
          className="pointer-events-auto rounded-full bg-black/35 p-2 text-white backdrop-blur-md"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}

export function CmsHomeHero() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-cms", fn);
    const t = setInterval(fn, 60_000);
    return () => {
      window.removeEventListener("lc-cms", fn);
      clearInterval(t);
    };
  }, []);

  void tick;
  const cms = getCms();
  const slides = activeBannersNow(cms).filter(
    (b) => b.desktopUrl.trim() || b.mobileUrl.trim()
  );

  if (slides.length === 0) {
    return <DealCarousel />;
  }

  return <CmsSlides slides={slides} />;
}
