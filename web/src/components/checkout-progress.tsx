"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = {
  /** 1 = address, 2 = order summary, 3 = payment */
  step: 1 | 2 | 3;
};

export function CheckoutProgress({ step }: Props) {
  const t = useTranslations("checkout");

  const items = [
    { n: 1 as const, label: t("progressAddress") },
    { n: 2 as const, label: t("progressOrderSummary") },
    { n: 3 as const, label: t("progressPayment") },
  ];

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-slate-200/90 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-3xl items-center gap-1 sm:gap-2">
        {items.map((it, i) => {
          const done = step > it.n;
          const active = step === it.n;
          return (
            <div key={it.n} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition",
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-[#0066ff] text-white shadow-[0_4px_14px_rgba(0,102,255,0.4)]"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : it.n}
                </div>
                <span
                  className={cn(
                    "hidden text-center text-[10px] font-bold uppercase tracking-wide sm:block",
                    active || done
                      ? "text-slate-800 dark:text-slate-100"
                      : "text-slate-400"
                  )}
                >
                  {it.label}
                </span>
              </div>
              {i < items.length - 1 ? (
                <div
                  className={cn(
                    "mx-0.5 h-0.5 min-w-[12px] flex-1 rounded-full sm:mx-1",
                    step > it.n ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
