"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Coins, RotateCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  loadGamification,
  saveGamification,
  todayKey,
} from "@/lib/gamification-storage";
import { cn } from "@/lib/utils";

export function EngagementHub() {
  const t = useTranslations("gamification");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(loadGamification);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setState(loadGamification());
  }, [open]);

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

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0066ff] to-[#7c3aed] text-white shadow-[0_8px_32px_rgba(0,102,255,0.45)] transition hover:scale-105 md:bottom-32"
        aria-label={t("openFab")}
      >
        <Gift className="h-6 w-6" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          aria-modal
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#0066ff]">
              <Coins className="h-4 w-4" />
              {t("points", { n: state.points })}
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
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

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
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
                    "mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition",
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
          </div>
        </div>
      ) : null}
    </>
  );
}
