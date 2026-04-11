"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  addCalendarDays,
  estimateDeliveryDaysFromPin,
} from "@/lib/product-trust";
import { CalendarDays } from "lucide-react";

export function DeliveryEstimator() {
  const t = useTranslations("product.trust");
  const locale = useLocale();
  const [pin, setPin] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const days = useMemo(
    () => (submitted ? estimateDeliveryDaysFromPin(pin) : null),
    [pin, submitted]
  );

  const formattedDate = useMemo(() => {
    if (days == null) return "";
    const d = addCalendarDays(new Date(), days);
    return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d);
  }, [days, locale]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.replace(/\D/g, "").length === 6) setSubmitted(true);
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/40">
      <p className="flex items-center gap-2 text-sm font-bold text-text-primary dark:text-slate-100">
        <CalendarDays className="h-4 w-4 text-[#0066ff]" />
        {t("deliveryEstimateTitle")}
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setSubmitted(false);
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
          }}
          placeholder={t("pinPlaceholder")}
          className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-text-primary outline-none focus:border-[#0066ff] dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0052cc]"
        >
          {t("checkDelivery")}
        </button>
      </form>
      {submitted && days != null ? (
        <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          {t("deliveryBy", { date: formattedDate })}
        </p>
      ) : (
        <p className="mt-2 text-xs font-semibold text-text-secondary dark:text-slate-400">
          {t("deliveryDemoHint")}
        </p>
      )}
    </div>
  );
}
