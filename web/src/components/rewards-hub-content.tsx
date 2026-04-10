"use client";

import { useState, useEffect, useCallback } from "react";
import { Coins, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  loadGamification,
  saveGamification,
  todayKey,
} from "@/lib/gamification-storage";
import { cn } from "@/lib/utils";

/** Shared Spin & Win + daily check-in + points (same data as EngagementHub modal). */
export function RewardsHubContent() {
  const t = useTranslations("gamification");
  const [state, setState] = useState(loadGamification);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  useEffect(() => {
    setState(loadGamification());
  }, []);

  const today = todayKey();
  const canCheckIn = state.lastCheckIn !== today;
  const canSpin = !state.spinWheelUsed;

  const checkIn = useCallback(() => {
    if (!canCheckIn) return;
    const next = {
      ...state,
      points: state.points + 5,
      lastCheckIn: today,
    };
    saveGamification(next);
    setState(next);
  }, [canCheckIn, state, today]);

  const spin = useCallback(() => {
    if (!canSpin) return;
    const pct = 5 + Math.floor(Math.random() * 6);
    const code = `LIBAS-SPIN${pct}`;
    setSpinResult(t("spinWon", { pct, code }));
    const next = { ...state, spinWheelUsed: true, points: state.points + pct };
    saveGamification(next);
    setState(next);
  }, [canSpin, state, t]);

  return (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold text-[#0066ff] dark:text-[#7cb4ff]">
        <Coins className="h-4 w-4 shrink-0" />
        {t("points", { n: state.points })}
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t("dailyTitle")}
          </p>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {t("dailyDesc")}
          </p>
          <button
            type="button"
            disabled={!canCheckIn}
            onClick={checkIn}
            className={cn(
              "mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white transition",
              canCheckIn
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
            )}
          >
            {canCheckIn ? t("checkInCta") : t("checkInDone")}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t("spinTitle")}
          </p>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {t("spinDesc")}
          </p>
          <button
            type="button"
            disabled={!canSpin}
            onClick={spin}
            className={cn(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition",
              canSpin
                ? "bg-[#0066ff] hover:bg-[#0052cc]"
                : "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
            )}
          >
            <RotateCw className="h-4 w-4" />
            {canSpin ? t("spinCta") : t("spinUsed")}
          </button>
          {spinResult ? (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              {spinResult}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
