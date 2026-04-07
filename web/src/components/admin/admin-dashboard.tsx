"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { readLiveCommerceStats } from "@/lib/live-commerce-stats";
import { computeFraudAlerts } from "@/lib/fraud-signals";
import {
  adminStats,
  adminStatsYesterday,
  conversionFunnel,
  deltaVsYesterdayPercent,
  hourlySalesToday,
  liveFeedPool,
  paymentMixToday,
  regionOrdersIndia,
  sparklineOrders,
  sparklineRevenue,
  sparklineUsers,
  sparklineVisitors,
} from "@/lib/admin-mock-data";
import type { AdminStatsPayload } from "@/lib/admin-stats-types";
import { MultiLayerSalesChart } from "@/components/admin/multi-layer-sales-chart";
import { SparklineMini } from "@/components/admin/sparkline-mini";
import { LowStockActionCenter } from "@/components/admin/low-stock-action-center";
import { AdminCustomerSync } from "@/components/admin/admin-customer-sync";
import { HourlySalesChart } from "@/components/admin/hourly-sales-chart";
import { ConversionFunnel } from "@/components/admin/conversion-funnel";
import { PaymentSplitChart } from "@/components/admin/payment-split-chart";
import { RegionIndiaPanel } from "@/components/admin/region-india-panel";
import { LiveActivityFeed } from "@/components/admin/live-activity-feed";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";

function DeltaLine({
  today,
  yesterday,
}: {
  today: number;
  yesterday: number;
}) {
  const t = useTranslations("admin");
  const d = deltaVsYesterdayPercent(today, yesterday);
  const up = d >= 0;
  return (
    <p
      className={`mt-1 flex flex-wrap items-center gap-1 text-[11px] font-bold ${
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      }`}
    >
      <span>{up ? t("upShort") : t("downShort")}</span>
      <span className="tabular-nums">{Math.abs(d).toFixed(1)}%</span>
      <span className="font-semibold text-slate-400">{t("vsYesterday")}</span>
    </p>
  );
}

type SrvStats = AdminStatsPayload;

export function AdminDashboard() {
  const t = useTranslations("admin");
  const y = adminStatsYesterday;
  const [live, setLive] = useState(() => readLiveCommerceStats());
  const [fraud, setFraud] = useState(() => computeFraudAlerts());
  const [srv, setSrv] = useState<SrvStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = (await res.json().catch(() => ({}))) as Partial<AdminStatsPayload> & {
          error?: string;
        };
        if (cancelled) return;
        if (
          res.ok &&
          typeof j.ordersToday === "number" &&
          typeof j.revenueToday === "number" &&
          typeof j.totalOrders === "number"
        ) {
          setSrv({
            ordersToday: j.ordersToday!,
            revenueToday: j.revenueToday!,
            ordersYesterday: j.ordersYesterday ?? 0,
            revenueYesterday: j.revenueYesterday ?? 0,
            totalOrders: j.totalOrders!,
            newUsersToday: j.newUsersToday ?? 0,
            paymentMix: Array.isArray(j.paymentMix) ? j.paymentMix : [],
            regionOrders: Array.isArray(j.regionOrders) ? j.regionOrders : [],
            hourlyToday: Array.isArray(j.hourlyToday) ? j.hourlyToday : [],
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function sync() {
      setLive(readLiveCommerceStats());
    }
    sync();
    window.addEventListener("lc-user-payment-history", sync);
    window.addEventListener("lc-wallet", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lc-user-payment-history", sync);
      window.removeEventListener("lc-wallet", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    function syncFraud() {
      setFraud(computeFraudAlerts());
    }
    syncFraud();
    window.addEventListener("lc-user-payment-history", syncFraud);
    window.addEventListener("lc-wallet", syncFraud);
    window.addEventListener("storage", syncFraud);
    return () => {
      window.removeEventListener("lc-user-payment-history", syncFraud);
      window.removeEventListener("lc-wallet", syncFraud);
      window.removeEventListener("storage", syncFraud);
    };
  }, []);

  const ordersToday = useMemo(() => {
    if (srv != null) return srv.ordersToday;
    const hasLive = live.ordersToday > 0 || live.revenueToday > 0;
    return hasLive ? live.ordersToday : adminStats.ordersToday;
  }, [srv, live.ordersToday, live.revenueToday]);

  const revenueToday = useMemo(() => {
    if (srv != null) return srv.revenueToday;
    const hasLive = live.ordersToday > 0 || live.revenueToday > 0;
    return hasLive ? live.revenueToday : adminStats.revenueToday;
  }, [srv, live.ordersToday, live.revenueToday]);

  const newUsersDisplay = useMemo(() => {
    if (srv != null) return srv.newUsersToday;
    return adminStats.newUsers;
  }, [srv]);

  const totalOrdersDisplay = useMemo(() => {
    if (srv != null) return srv.totalOrders;
    return adminStats.visitors;
  }, [srv]);

  const aov = useMemo(() => {
    if (srv != null && srv.ordersToday > 0) {
      return Math.round(srv.revenueToday / srv.ordersToday);
    }
    if (live.ordersToday > 0) {
      return Math.round(live.revenueToday / live.ordersToday);
    }
    return 0;
  }, [srv, live.ordersToday, live.revenueToday]);

  const hourlyChartData = useMemo(() => {
    if (srv?.hourlyToday?.some((h) => h.revenue > 0)) return srv.hourlyToday;
    return hourlySalesToday;
  }, [srv]);

  const paymentSplitData = useMemo(() => {
    if (srv?.paymentMix?.some((p) => p.amount > 0)) return srv.paymentMix;
    return paymentMixToday;
  }, [srv]);

  const regionData = useMemo(() => {
    if (srv?.regionOrders?.length) return srv.regionOrders;
    return regionOrdersIndia;
  }, [srv]);

  const statCards = useMemo(() => {
    const cards = [
      {
        label: t("statOrders"),
        value: ordersToday.toLocaleString("en-IN"),
        spark: sparklineOrders,
        color: "#0066ff",
        sparkId: "orders",
        today: ordersToday,
        yesterday: srv != null ? srv.ordersYesterday : y.orders,
        showDelta: true,
      },
      {
        label: t("statRevenue"),
        value: `₹${revenueToday.toLocaleString("en-IN")}`,
        spark: sparklineRevenue,
        color: "#059669",
        sparkId: "rev",
        today: revenueToday,
        yesterday: srv != null ? srv.revenueYesterday : y.revenue,
        showDelta: true,
      },
      {
        label: t("statUsers"),
        value: newUsersDisplay.toLocaleString("en-IN"),
        spark: sparklineUsers,
        color: "#7c3aed",
        sparkId: "users",
        today: newUsersDisplay,
        yesterday: srv != null ? 0 : y.newUsers,
        showDelta: srv == null,
      },
      {
        label: srv != null ? t("statAllOrders") : t("statVisitors"),
        value: totalOrdersDisplay.toLocaleString("en-IN"),
        spark: sparklineVisitors,
        color: "#d97706",
        sparkId: "vis",
        today: totalOrdersDisplay,
        yesterday: srv != null ? 0 : y.visitors,
        showDelta: srv == null,
      },
    ];
    return cards;
  }, [
    t,
    ordersToday,
    revenueToday,
    newUsersDisplay,
    totalOrdersDisplay,
    srv,
    y.orders,
    y.revenue,
    y.newUsers,
    y.visitors,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("dashboardTitle")}
        </p>
        <p className="text-sm text-slate-500">{t("dashboardSubtitle")}</p>
      </div>

      {fraud.activeAlerts > 0 ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/30 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-rose-900 dark:text-rose-100">
              {t("dashboardFraudAlert")}
            </p>
            <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-200/90">
              {t("dashboardFraudAlertBody", { n: fraud.activeAlerts })}
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-rose-900/85 dark:text-rose-200/85">
              {fraud.messages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.sparkId}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                  {c.value}
                </p>
                {c.showDelta ? (
                  <DeltaLine today={c.today} yesterday={c.yesterday} />
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">{t("firestoreMetricNote")}</p>
                )}
              </div>
              <div className="flex w-24 shrink-0 flex-col items-end gap-1">
                <SparklineMini data={c.spark} color={c.color} id={c.sparkId} />
              </div>
            </div>
            <p className="mt-2 text-[10px] font-medium text-slate-400">
              {srv ? t("realtimeHintFirestore") : t("realtimeHint")}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("aovTitle")}
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                {t("aovValue", { amount: aov.toLocaleString("en-IN") })}
              </p>
            </div>
          </div>
          <p className="max-w-xl text-sm text-slate-500">{t("aovHint")}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HourlySalesChart data={hourlyChartData} />
        </div>
        <div className="lg:col-span-1">
          <LiveActivityFeed events={liveFeedPool} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ConversionFunnel
          visitors={conversionFunnel.visitors}
          productViews={conversionFunnel.productViews}
          addToCart={conversionFunnel.addToCart}
          paidOrders={srv?.ordersToday ?? conversionFunnel.paidOrders}
        />
        <PaymentSplitChart data={paymentSplitData} />
        <RegionIndiaPanel regions={regionData} />
      </div>

      <MultiLayerSalesChart />

      <LowStockActionCenter />

      <AdminCustomerSync />
    </div>
  );
}
