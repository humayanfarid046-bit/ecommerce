"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ADMIN_SALES_GRAPH_CATEGORIES,
  getSalesGraphData,
  type AdminSalesGraphCategoryId,
  type SalesGraphPoint,
} from "@/lib/admin-mock-data";
import { Download, Printer, Layers } from "lucide-react";

type ChartRow = SalesGraphPoint & { viewsK: number; viewsPrevK: number };

function toRows(raw: SalesGraphPoint[]): ChartRow[] {
  return raw.map((d) => ({
    ...d,
    viewsK: Math.max(1, Math.round(d.views / 100)),
    viewsPrevK: Math.max(1, Math.round(d.viewsPrev / 100)),
  }));
}

function downloadCsv(rows: ChartRow[], filename: string) {
  const headers = [
    "Period",
    "Revenue",
    "Orders",
    "Product_views",
    "Revenue_prev",
    "Orders_prev",
    "Views_prev",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.name,
        r.revenue,
        r.orders,
        r.views,
        r.revenuePrev,
        r.ordersPrev,
        r.viewsPrev,
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ChartTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  label?: string | number;
}) {
  const t = useTranslations("admin");
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-900">
      <p className="mb-2 font-bold text-slate-900 dark:text-slate-100">
        {t("tooltipPeriodLabel", { label: String(label ?? "") })}
      </p>
      <ul className="space-y-1 text-slate-700 dark:text-slate-200">
        <li>
          <span className="text-slate-500">{t("legendRevenue")}:</span>{" "}
          ₹{row.revenue.toLocaleString("en-IN")}
        </li>
        <li>
          <span className="text-slate-500">{t("legendOrders")}:</span>{" "}
          {row.orders.toLocaleString("en-IN")}
        </li>
        <li>
          <span className="text-slate-500">{t("legendViews")}:</span>{" "}
          {row.views.toLocaleString("en-IN")}
        </li>
        <li className="border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-700">
          {t("tooltipPrevHint")}: ₹{row.revenuePrev.toLocaleString("en-IN")} ·{" "}
          {row.ordersPrev} {t("ordersShort")} · {row.viewsPrev.toLocaleString("en-IN")}{" "}
          {t("viewsShort")}
        </li>
      </ul>
    </div>
  );
}

function openPrintReport(
  title: string,
  rows: ChartRow[],
  labels: { period: string; revenue: string; orders: string; views: string; hint: string }
) {
  const w = window.open("", "_blank");
  if (!w) return;
  const table = rows
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td>${r.revenue}</td><td>${r.orders}</td><td>${r.views}</td></tr>`
    )
    .join("");
  w.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:system-ui,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f3f4f6}</style></head><body><h1>${title}</h1><table><thead><tr><th>${labels.period}</th><th>${labels.revenue}</th><th>${labels.orders}</th><th>${labels.views}</th></tr></thead><tbody>${table}</tbody></table><p style="margin-top:24px;color:#666">${labels.hint}</p></body></html>`
  );
  w.document.close();
  w.focus();
  w.print();
}

export function MultiLayerSalesChart() {
  const t = useTranslations("admin");
  const tc = useTranslations("categories");
  const uid = useId();
  const gradId = `ml-rev-${uid}`;

  const [period, setPeriod] = useState<"week" | "month">("week");
  const [categoryId, setCategoryId] = useState<AdminSalesGraphCategoryId>("all");
  const [compare, setCompare] = useState(false);

  const raw = useMemo(
    () => getSalesGraphData(categoryId, period),
    [categoryId, period]
  );
  const data = useMemo(() => toRows(raw), [raw]);

  const title = useMemo(() => {
    return period === "week" ? t("chartWeek") : t("chartMonth");
  }, [period, t]);

  const handleCsv = useCallback(() => {
    const slug = categoryId === "all" ? "all" : categoryId;
    downloadCsv(data, `sales-report-${slug}-${period}.csv`);
  }, [data, categoryId, period]);

  const handlePrint = useCallback(() => {
    openPrintReport(`${title} — ${categoryId}`, data, {
      period: t("colPeriod"),
      revenue: t("revenue"),
      orders: t("legendOrders"),
      views: t("legendViews"),
      hint: t("exportPrintHint"),
    });
  }, [data, title, categoryId, t]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 shrink-0 text-[#0066ff]" />
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("multilayerTitle")}
            </p>
            <p className="text-[11px] text-slate-500">{t("multilayerHint")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value as AdminSalesGraphCategoryId)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {ADMIN_SALES_GRAPH_CATEGORIES.map((slug) => (
              <option key={slug} value={slug}>
                {slug === "all" ? t("catAll") : tc(slug)}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${
                period === "week"
                  ? "bg-[#0066ff] text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t("periodWeek")}
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${
                period === "month"
                  ? "bg-[#0066ff] text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t("periodMonth")}
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="rounded border-slate-300"
            />
            {t("compareOverlay")}
          </label>
          <button
            type="button"
            onClick={handleCsv}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            {t("exportCsv")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5" />
            {t("exportPrint")}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <div className="mt-3 w-full min-w-0">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0066ff" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#0066ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tick={{ fontSize: 10 }}
              stroke="#0066ff"
              tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 10 }}
              stroke="#059669"
              width={44}
            />
            <Tooltip content={(props) => <ChartTooltip {...props} />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: 8 }}
              formatter={(value) => <span className="text-slate-600 dark:text-slate-300">{value}</span>}
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name={t("legendRevenue")}
              stroke="#0066ff"
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={false}
            />
            {compare ? (
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenuePrev"
                name={t("legendRevenuePrev")}
                stroke="#7c3aed"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              name={t("legendOrders")}
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {compare ? (
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="ordersPrev"
                name={t("legendOrdersPrev")}
                stroke="#34d399"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="viewsK"
              name={t("legendViews")}
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {compare ? (
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="viewsPrevK"
                name={t("legendViewsPrev")}
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">{t("viewsScaleNote")}</p>
    </div>
  );
}
