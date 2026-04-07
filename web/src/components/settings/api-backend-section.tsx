"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  getApiHealth,
  getApiMe,
  isApiUrlConfigured,
} from "@/lib/api-client";
import { useTranslations } from "next-intl";
import { Server, Wifi, WifiOff } from "lucide-react";

export function ApiBackendSection() {
  const t = useTranslations("account");
  const { user } = useAuth();
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [meUid, setMeUid] = useState<string | null>(null);
  const [meErr, setMeErr] = useState(false);
  const configured = isApiUrlConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    void (async () => {
      const h = await getApiHealth();
      if (!cancelled) setHealthOk(Boolean(h?.ok));
      if (!user) {
        if (!cancelled) {
          setMeUid(null);
          setMeErr(false);
        }
        return;
      }
      const me = await getApiMe();
      if (!cancelled) {
        if (me?.uid) {
          setMeUid(me.uid);
          setMeErr(false);
        } else {
          setMeUid(null);
          setMeErr(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, user?.uid]);

  if (!configured) {
    return (
      <section className="glass rounded-2xl border border-slate-200/80 p-6 dark:border-slate-700/80">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Server className="h-5 w-5 text-[#0066ff]" />
          {t("apiBackendTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("apiBackendNotSet")}
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl border border-slate-200/80 p-6 dark:border-slate-700/80">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <Server className="h-5 w-5 text-[#0066ff]" />
        {t("apiBackendTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("apiBackendSubtitle")}
      </p>

      <ul className="mt-4 space-y-3 text-sm">
        <li className="flex items-center gap-2">
          {healthOk === true ? (
            <Wifi className="h-4 w-4 text-emerald-600" />
          ) : healthOk === false ? (
            <WifiOff className="h-4 w-4 text-rose-500" />
          ) : (
            <span className="h-4 w-4 animate-pulse rounded bg-slate-300 dark:bg-slate-600" />
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {t("apiHealthLabel")}:
          </span>
          <span>
            {healthOk === true
              ? t("apiStatusOk")
              : healthOk === false
                ? t("apiStatusFail")
                : "…"}
          </span>
        </li>
        <li className="flex flex-wrap items-start gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {t("apiSessionLabel")}:
          </span>
          {!user ? (
            <span className="text-slate-500">{t("apiSessionNeedLogin")}</span>
          ) : meUid ? (
            <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
              {t("apiSessionOk", { uid: meUid })}
            </span>
          ) : meErr ? (
            <span className="text-rose-600">{t("apiSessionFail")}</span>
          ) : (
            <span className="text-slate-500">…</span>
          )}
        </li>
      </ul>
    </section>
  );
}
