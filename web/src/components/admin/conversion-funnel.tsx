"use client";

import { useTranslations } from "next-intl";

type Props = {
  visitors: number;
  productViews: number;
  addToCart: number;
  paidOrders: number;
};

export function ConversionFunnel({
  visitors,
  productViews,
  addToCart,
  paidOrders,
}: Props) {
  const t = useTranslations("admin");
  const max = Math.max(visitors, 1);
  const stages = [
    { key: "funnelVisitors" as const, value: visitors, pct: 100 },
    {
      key: "funnelViewers" as const,
      value: productViews,
      pct: (productViews / max) * 100,
    },
    {
      key: "funnelCart" as const,
      value: addToCart,
      pct: (addToCart / max) * 100,
    },
    {
      key: "funnelPaid" as const,
      value: paidOrders,
      pct: (paidOrders / max) * 100,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {t("funnelTitle")}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{t("funnelHint")}</p>
      <div className="mt-4 space-y-3">
        {stages.map((s, i) => (
          <div key={s.key}>
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>{t(s.key)}</span>
              <span className="tabular-nums text-slate-500">
                {s.value.toLocaleString("en-IN")}
                {i > 0 ? (
                  <span className="ml-2 text-[10px] font-medium text-slate-400">
                    ({((s.value / visitors) * 100).toFixed(1)}%)
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-violet-500 transition-all"
                style={{ width: `${Math.max(s.pct, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
