"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { pickRandomPerson, randomMins } from "@/lib/social-proof-messages";

type Props = {
  /** Current product title on PDP; optional on other pages. */
  productTitle?: string;
};

export function SocialProofToast({ productTitle }: Props) {
  const pathname = usePathname();
  const t = useTranslations("product.trust");
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState({
    name: "",
    city: "",
    mins: 5,
  });

  const hide =
    pathname?.includes("/checkout") ||
    pathname?.includes("/cart") ||
    pathname?.includes("/account") ||
    pathname?.includes("/login") ||
    pathname?.includes("/forgot-password");

  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const isHome = segments.length <= 1;

  const showOnThisPage =
    !hide &&
    (isHome ||
      pathname?.includes("/product/") ||
      pathname?.includes("/category/") ||
      pathname?.includes("/search"));

  const rotate = useCallback(() => {
    const p = pickRandomPerson();
    setPayload({ name: p.name, city: p.city, mins: randomMins() });
    setVisible(true);
    window.setTimeout(() => setVisible(false), 5200);
  }, []);

  useEffect(() => {
    if (!showOnThisPage) return;
    const first = window.setTimeout(rotate, 4000 + Math.random() * 3000);
    const interval = window.setInterval(
      () => rotate(),
      28000 + Math.random() * 12000
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [showOnThisPage, rotate]);

  if (!showOnThisPage) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, x: 40, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pointer-events-none fixed bottom-6 right-4 z-[55] max-w-[min(100vw-2rem,320px)] rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_12px_40px_rgba(0,102,255,0.15)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 md:bottom-8 md:right-8"
          role="status"
        >
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066ff]/12 text-[#0066ff]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {t("socialProofTitle")}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                {t("socialProofBody", {
                  name: payload.name,
                  city: payload.city,
                  mins: payload.mins,
                  product: productTitle ?? t("socialProofProductFallback"),
                })}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
