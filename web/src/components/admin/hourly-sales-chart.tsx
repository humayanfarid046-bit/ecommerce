"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";

type Props = {
  data: { name: string; revenue: number }[];
};

export function HourlySalesChart({ data }: Props) {
  const t = useTranslations("admin");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {t("hourlyTrendTitle")}
      </p>
      <p className="mb-3 text-[11px] text-slate-400">{t("hourlyTrendHint")}</p>
      <div className="w-full min-w-0">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="#94a3b8"
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? [`₹${value.toLocaleString("en-IN")}`, t("revenue")]
                  : ["", ""]
              }
              labelFormatter={(label) => `${t("hourPrefix")} ${label}:00`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="revenue" fill="#0066ff" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
