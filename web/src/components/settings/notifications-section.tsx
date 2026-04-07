"use client";

import { useState } from "react";
import {
  readNotificationPrefs,
  writeNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

export function NotificationsSection() {
  const t = useTranslations("account");
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    readNotificationPrefs()
  );

  function patch(p: Partial<NotificationPrefs>) {
    const next = { ...prefs, ...p };
    setPrefs(next);
    writeNotificationPrefs(p);
  }

  return (
    <section className="glass rounded-2xl border border-slate-200/80 p-6 dark:border-slate-700/80">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <Bell className="h-5 w-5 text-[#0066ff]" />
        {t("notificationsTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("notificationsSubtitle")}
      </p>

      <h3 className="mt-6 text-sm font-bold text-slate-800 dark:text-slate-200">
        {t("commPreferences")}
      </h3>
      <ul className="mt-3 space-y-3">
        {(
          [
            ["emailOffers", "prefEmail"] as const,
            ["smsOffers", "prefSms"] as const,
            ["pushOffers", "prefPush"] as const,
          ] as const
        ).map(([key, labelKey]) => (
          <li
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-700"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t(labelKey)}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => patch({ [key]: !prefs[key] })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                prefs[key] ? "bg-[#0066ff]" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  prefs[key] ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-sm font-bold text-slate-800 dark:text-slate-200">
        {t("orderUpdatesSection")}
      </h3>
      <ul className="mt-3 space-y-3">
        <li className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-700">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("orderStatusOnly")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.orderUpdates}
            onClick={() => patch({ orderUpdates: !prefs.orderUpdates })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              prefs.orderUpdates ? "bg-[#0066ff]" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                prefs.orderUpdates ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </li>
        <li className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-700">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("promoOffers")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.promoOffers}
            onClick={() => patch({ promoOffers: !prefs.promoOffers })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              prefs.promoOffers ? "bg-[#0066ff]" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                prefs.promoOffers ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </li>
      </ul>
    </section>
  );
}
