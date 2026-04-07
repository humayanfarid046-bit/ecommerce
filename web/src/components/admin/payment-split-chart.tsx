"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";

const COLORS = ["#0066ff", "#f59e0b", "#10b981", "#8b5cf6"];

type Row = {
  key: "upi" | "cod" | "card" | "netbanking";
  percent: number;
  amount: number;
};

type Props = {
  data: readonly Row[];
};

export function PaymentSplitChart({ data }: Props) {
  const t = useTranslations("admin");
  const chartData = data.map((d) => ({
    name: t(`payMethod_${d.key}`),
    value: d.percent,
    amount: d.amount,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {t("paymentSplitTitle")}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{t("paymentSplitHint")}</p>
      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="h-[200px] w-full max-w-[200px]">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _n, p) => {
                  const payload = p?.payload as { name?: string; amount?: number; value?: number };
                  const amt = payload?.amount;
                  const pct = payload?.value;
                  if (typeof pct === "number" && typeof amt === "number") {
                    return [`${pct}% · ₹${amt.toLocaleString("en-IN")}`, payload?.name ?? ""];
                  }
                  return [String(value ?? ""), ""];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full flex-1 space-y-2 text-sm">
          {data.map((d, i) => (
            <li key={d.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {t(`payMethod_${d.key}`)}
                </span>
              </span>
              <span className="tabular-nums text-slate-600 dark:text-slate-300">
                {d.percent}% · ₹{d.amount.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
