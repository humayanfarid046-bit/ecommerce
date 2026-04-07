"use client";

import { Check, ClipboardList, Gift, Package, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STEP_ICONS = [ClipboardList, Package, Truck, Gift] as const;

type Props = {
  currentStep: number;
  /** 0–3 inclusive; cancelled greys out all */
  cancelled?: boolean;
};

export function OrderStatusTracker({ currentStep, cancelled }: Props) {
  const t = useTranslations("orders");
  const labels = [
    t("stepOrdered"),
    t("stepPacked"),
    t("stepOutForDelivery"),
    t("stepDelivered"),
  ];

  const delivered = !cancelled && currentStep >= 3;

  return (
    <div className="w-full">
      <div className="relative px-1 pt-1">
        <div className="absolute left-[12.5%] right-[12.5%] top-[17px] z-0 h-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#7c3aed]"
            initial={false}
            animate={{
              width: cancelled
                ? "0%"
                : `${Math.min(100, (currentStep / 3) * 100)}%`,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
        <div className="relative z-[1] flex justify-between">
          {labels.map((label, i) => {
            const done = !cancelled && (i < currentStep || delivered);
            const active =
              !cancelled && i === currentStep && !delivered;
            const future = cancelled || (!delivered && i > currentStep);
            const Icon = STEP_ICONS[i] ?? Package;

            return (
              <div
                key={label}
                className="flex w-[22%] max-w-[5.5rem] flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10",
                    cancelled && "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800",
                    !cancelled &&
                      done &&
                      "border-[#0066ff] bg-[#0066ff] text-white shadow-[0_0_0_4px_rgba(0,102,255,0.2)]",
                    !cancelled &&
                      active &&
                      "border-[#0066ff] bg-white text-[#0066ff] shadow-[0_0_0_4px_rgba(0,102,255,0.35)] dark:bg-slate-900",
                    !cancelled &&
                      future &&
                      "border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-600"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={3} />
                  ) : (
                    <Icon
                      className={cn(
                        "h-4 w-4 sm:h-[18px] sm:w-[18px]",
                        future && "opacity-45"
                      )}
                      strokeWidth={2}
                    />
                  )}
                  {active && !cancelled ? (
                    <span className="absolute inset-0 animate-ping rounded-full border border-[#0066ff]/40" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:text-[10px]",
                    cancelled && "text-slate-400",
                    !cancelled &&
                      done &&
                      "text-[#0066ff] dark:text-[#5b9dff]",
                    !cancelled && active && "text-slate-900 dark:text-white",
                    !cancelled && future && "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
