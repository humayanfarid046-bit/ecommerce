"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CATALOG_EVENT,
  CATALOG_SAVE_STATUS_EVENT,
  getCatalogServerBackend,
  getRemoteCatalogProductCount,
  readCatalogProducts,
} from "@/lib/catalog-products-storage";
import { AlertTriangle, CloudOff, Info } from "lucide-react";

/** Explains why shoppers may not see admin products (Firestore vs Storage vs sync). */
export function CatalogLiveBanner() {
  const t = useTranslations("admin");
  const [, bump] = useState(0);

  useEffect(() => {
    const sync = () => bump((n) => n + 1);
    window.addEventListener(CATALOG_EVENT, sync);
    window.addEventListener(CATALOG_SAVE_STATUS_EVENT, sync);
    return () => {
      window.removeEventListener(CATALOG_EVENT, sync);
      window.removeEventListener(CATALOG_SAVE_STATUS_EVENT, sync);
    };
  }, []);

  const backend = getCatalogServerBackend();
  const remoteCount = getRemoteCatalogProductCount();
  const localCount = readCatalogProducts().length;

  if (backend === "server_unconfigured") {
    return (
      <div className="flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-100">
        <CloudOff className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
        <div>
          <p className="font-extrabold">{t("catalogLiveBannerUnconfiguredTitle")}</p>
          <p className="mt-1 text-rose-900/90 dark:text-rose-200/90">
            {t("catalogLiveBannerUnconfiguredBody")}
          </p>
        </div>
      </div>
    );
  }

  if (backend === "firestore" && localCount > 0 && remoteCount === 0) {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div>
          <p className="font-extrabold">{t("catalogLiveBannerSyncTitle")}</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
            {t("catalogLiveBannerSyncBody", { localCount })}
          </p>
        </div>
      </div>
    );
  }

  if (backend === "firestore" && localCount === 0 && remoteCount === 0) {
    return (
      <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
        <Info className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
        <div>
          <p className="font-extrabold text-slate-900 dark:text-slate-100">
            {t("catalogLiveBannerEmptyTitle")}
          </p>
          <p className="mt-1">{t("catalogLiveBannerEmptyBody")}</p>
        </div>
      </div>
    );
  }

  return null;
}
