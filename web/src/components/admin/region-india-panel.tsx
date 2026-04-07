"use client";

import { useTranslations } from "next-intl";

type Row = { regionKey: string; orders: number };

type Props = {
  regions: Row[];
};

/** Simplified India silhouette (decorative) + regional order bars. */
export function RegionIndiaPanel({ regions }: Props) {
  const t = useTranslations("admin");
  const maxO = Math.max(...regions.map((r) => r.orders), 1);
  const sorted = [...regions].sort((a, b) => b.orders - a.orders);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {t("regionMapTitle")}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{t("regionMapHint")}</p>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="flex shrink-0 justify-center lg:w-36">
          <svg
            viewBox="0 0 120 140"
            className="h-36 w-auto text-slate-200 dark:text-slate-700"
            aria-hidden
          >
            <title>{t("regionMapTitle")}</title>
            {/* Stylized subcontinent outline */}
            <path
              fill="currentColor"
              d="M58 4 C78 8 95 22 102 42 C108 58 106 78 98 94 C92 108 82 118 68 124 C54 132 38 134 24 128 C12 122 6 108 8 92 C10 72 22 54 38 42 C44 22 52 8 58 4 Z M28 96 C34 102 44 106 54 104 C62 100 68 92 70 82 C72 72 68 64 60 60 C52 56 42 58 34 64 C26 72 22 84 28 96 Z"
              opacity={0.35}
            />
            <circle cx="52" cy="38" r="6" className="fill-[#0066ff]/80" />
            <circle cx="78" cy="58" r="5" className="fill-[#0066ff]/50" />
            <circle cx="44" cy="72" r="4" className="fill-[#0066ff]/60" />
            <circle cx="68" cy="88" r="5" className="fill-[#0066ff]/70" />
          </svg>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {sorted.map((r) => {
            const intensity = r.orders / maxO;
            return (
              <li key={r.regionKey}>
                <div className="mb-0.5 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>{t(`region_${r.regionKey}`)}</span>
                  <span className="tabular-nums text-slate-500">
                    {r.orders} {t("ordersUnit")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-[#0066ff]"
                    style={{
                      width: `${Math.max(intensity * 100, 4)}%`,
                      opacity: 0.45 + intensity * 0.55,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
