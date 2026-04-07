"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { LiveFeedEvent } from "@/lib/admin-mock-data";
import { liveOnlineUsers } from "@/lib/admin-mock-data";
import { Radio } from "lucide-react";

type Props = {
  events: LiveFeedEvent[];
};

export function LiveActivityFeed({ events }: Props) {
  const t = useTranslations("admin");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((n) => (n + 1) % Math.max(events.length, 1));
    }, 4200);
    return () => window.clearInterval(id);
  }, [events.length]);

  const current = events[idx] ?? events[0];
  const city = current ? t(`city_${current.cityKey}`) : "";
  const product = current?.productTitle ?? "";

  const line = current
    ? current.kind === "checkout"
      ? t("feedCheckout", { city })
      : current.kind === "cart"
        ? t("feedCart", { city, product })
        : current.kind === "wishlist"
          ? t("feedWishlist", { city, product })
          : t("feedView", { city, product })
    : "";

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
          <Radio className="h-4 w-4 animate-pulse" />
          <p className="text-xs font-extrabold uppercase tracking-wide">{t("liveFeedTitle")}</p>
        </div>
        <p className="text-[11px] font-semibold text-emerald-700/90 dark:text-emerald-300/90">
          {t("liveOnline", { count: liveOnlineUsers })}
        </p>
      </div>
      <p className="mt-3 min-h-[2.75rem] text-sm leading-relaxed text-slate-800 dark:text-slate-100">
        {line}
      </p>
      <p className="mt-2 text-[10px] text-slate-400">{t("liveFeedDemoNote")}</p>
    </div>
  );
}
