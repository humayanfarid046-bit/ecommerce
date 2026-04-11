"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarCheck2, Coins, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  loadGamification,
  saveGamification,
  todayKey,
} from "@/lib/gamification-storage";
import { cn } from "@/lib/utils";
import {
  appCard,
  appSubhead,
  appTextTitle,
  gradientCta,
  pressable,
  rewardsAccentRing,
  sectionLabel,
} from "@/lib/app-inner-ui";

/** Spin & Win + daily check-in — compact game-style cards. */
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
    <div className="space-y-5">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-[18px] px-4 py-4",
          appCard,
          rewardsAccentRing
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 text-amber-700 dark:from-amber-400/20 dark:to-amber-500/5 dark:text-amber-300">
            <Coins className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className={sectionLabel}>{t("pointsLabel")}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-[#e8edf5]">
              {t("points", { n: state.points })}
            </p>
          </div>
        </div>
      </div>

      <div className={cn("space-y-4 p-4 sm:p-5", appCard)}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CalendarCheck2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-[15px] font-semibold", appTextTitle)}>
              {t("dailyTitle")}
            </h3>
            <p className={cn("mt-1.5 text-[13px] leading-relaxed", appSubhead)}>
              {t("dailyDesc")}
            </p>
            <button
              type="button"
              disabled={!canCheckIn}
              onClick={checkIn}
              className={cn(
                "mt-4 w-full px-4 py-3.5 text-[13px]",
                pressable,
                canCheckIn
                  ? gradientCta
                  : "cursor-not-allowed rounded-[12px] bg-slate-200 font-semibold text-slate-500 dark:bg-slate-700/80 dark:text-slate-400"
              )}
            >
              {canCheckIn ? t("checkInCta") : t("checkInDone")}
            </button>
          </div>
        </div>
      </div>

      <div className={cn("space-y-4 p-4 sm:p-5", appCard)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="mx-auto flex shrink-0 flex-col items-center gap-2 sm:mx-0">
            <div
              className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center"
              aria-hidden
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/25 via-fuchsia-500/15 to-cyan-400/20 opacity-90 blur-md dark:from-amber-400/15 dark:via-fuchsia-500/10 dark:to-cyan-500/15" />
              <span
                className={cn(
                  "relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 border-dashed border-amber-400/45 dark:border-amber-300/35",
                  rewardsAccentRing
                )}
              >
                <Sparkles className="h-7 w-7 text-amber-600 dark:text-amber-300" strokeWidth={2} />
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/90 dark:text-amber-200/80">
              Spin
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-[15px] font-semibold", appTextTitle)}>
              {t("spinTitle")}
            </h3>
            <p className={cn("mt-1.5 text-[13px] leading-relaxed", appSubhead)}>
              {t("spinDesc")}
            </p>
            <button
              type="button"
              disabled={!canSpin}
              onClick={spin}
              className={cn(
                "mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-3.5 text-[13px]",
                pressable,
                canSpin
                  ? gradientCta
                  : "cursor-not-allowed rounded-[12px] bg-slate-200 font-semibold text-slate-500 dark:bg-slate-700/80 dark:text-slate-400"
              )}
            >
              <Sparkles className="h-4 w-4 opacity-90" />
              {canSpin ? t("spinCta") : t("spinUsed")}
            </button>
            {spinResult ? (
              <p
                className="mt-4 rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[12px] font-medium leading-relaxed text-emerald-900 dark:border-emerald-400/15 dark:bg-emerald-950/40 dark:text-emerald-100"
                role="status"
              >
                {spinResult}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
