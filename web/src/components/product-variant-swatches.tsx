"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type ColorOpt = { id: string; label: string; hex: string };

type Props = {
  sizes?: string[];
  colors?: ColorOpt[];
};

/** Size pills + color circles — replaces dropdowns for a modern PDP (selection is UI-only for demo). */
export function ProductVariantSwatches({ sizes, colors }: Props) {
  const t = useTranslations("product");
  const [size, setSize] = useState(sizes?.[0] ?? "");
  const [colorId, setColorId] = useState(colors?.[0]?.id ?? "");

  if ((!sizes || sizes.length === 0) && (!colors || colors.length === 0)) {
    return null;
  }

  return (
    <div className="mb-5 space-y-4">
      {sizes && sizes.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary dark:text-neutral-400">
            {t("selectSize")}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  "min-h-[40px] min-w-[44px] rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  size === s
                    ? "border-[#2874f0] bg-[#2874f0]/10 text-[#2874f0] ring-1 ring-[#2874f0]/30"
                    : "border-[#E5E7EB] bg-white text-neutral-800 hover:border-[#2874f0]/50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {colors && colors.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary dark:text-neutral-400">
            {t("selectColor")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {colors.map((c) => {
              const selected = colorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  onClick={() => setColorId(c.id)}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition",
                    selected
                      ? "border-[#2874f0] ring-2 ring-[#2874f0]/25"
                      : "border-[#E5E7EB] hover:border-[#2874f0]/40 dark:border-slate-600"
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full shadow-inner ring-1 ring-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
