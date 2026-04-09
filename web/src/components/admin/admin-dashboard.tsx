"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { readLiveCommerceStats } from "@/lib/live-commerce-stats";
import {
  computeFraudAlertItems,
  formatFraudAlertItem,
  fraudAlertItemKey,
} from "@/lib/fraud-signals";
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
} from "@/lib/admin-types";
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
import { AlertTriangle, TrendingUp, Users, Search, Truck, Wallet, MapPin } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { Link, useRouter } from "@/i18n/navigation";

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
  const router = useRouter();
  const y = adminStatsYesterday;
  const [live, setLive] = useState(() => readLiveCommerceStats());
  const [customerFind, setCustomerFind] = useState("");
  const [fraudItems, setFraudItems] = useState(() => computeFraudAlertItems());
  const [srv, setSrv] = useState<SrvStats | null>(null);
  const [invAlerts, setInvAlerts] = useState<
    {
      alertId: string;
      title: string;
      variantId: string;
      available: number;
      reorderLevel: number;
      status: "open" | "resolved";
    }[]
  >([]);
  const [deliveryOps, setDeliveryOps] = useState<{
    pendingOutForDelivery: number;
    pendingTodayPlacedOutForDelivery: number;
    topPerformer: { partnerId: string; partnerName: string; deliveredToday: number } | null;
    avgDeliveryMinutesToday: number | null;
    liveRiders: Array<{
      uid: string;
      name: string;
      disabled: boolean;
      dutyOnline: boolean;
      outForDeliveryCount: number;
      lastLat: number | null;
      lastLng: number | null;
    }>;
  } | null>(null);
  const [riderWalletPayload, setRiderWalletPayload] = useState<{
    wallets: Array<{
      uid: string;
      name: string;
      disabled: boolean;
      cashInHandRupees: number;
      onlineReportedLifetimeRupees: number;
      lastSettledAt: number | null;
    }>;
    totals: { cashWithRidersRupees: number; onlineLifetimeReportedRupees: number };
  } | null>(null);
  const [walletBusyUid, setWalletBusyUid] = useState<string | null>(null);

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
    let cancelled = false;
    void (async () => {
      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/admin/inventory", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const j = (await res.json().catch(() => ({}))) as {
          alerts?: {
            alertId: string;
            title: string;
            variantId: string;
            available: number;
            reorderLevel: number;
            status: "open" | "resolved";
          }[];
        };
        if (!cancelled && Array.isArray(j.alerts)) {
          setInvAlerts(j.alerts);
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
    let cancelled = false;
    void (async () => {
      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken();
        if (!token) return;
        const [resOps, resW] = await Promise.all([
          fetch("/api/admin/delivery-ops", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch("/api/admin/rider-wallets", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);
        const jOps = (await resOps.json().catch(() => ({}))) as {
          pendingOutForDelivery?: number;
          pendingTodayPlacedOutForDelivery?: number;
          topPerformer?: {
            partnerId: string;
            partnerName: string;
            deliveredToday: number;
          } | null;
          avgDeliveryMinutesToday?: number | null;
          liveRiders?: Array<{
            uid: string;
            name: string;
            disabled: boolean;
            dutyOnline: boolean;
            outForDeliveryCount: number;
            lastLat: number | null;
            lastLng: number | null;
          }>;
        };
        const jW = (await resW.json().catch(() => ({}))) as {
          wallets?: Array<{
            uid: string;
            name: string;
            disabled: boolean;
            cashInHandRupees: number;
            onlineReportedLifetimeRupees: number;
            lastSettledAt: number | null;
          }>;
          totals?: { cashWithRidersRupees: number; onlineLifetimeReportedRupees: number };
        };
        if (cancelled) return;
        if (
          resOps.ok &&
          typeof jOps.pendingOutForDelivery === "number" &&
          Array.isArray(jOps.liveRiders)
        ) {
          setDeliveryOps({
            pendingOutForDelivery: jOps.pendingOutForDelivery,
            pendingTodayPlacedOutForDelivery: jOps.pendingTodayPlacedOutForDelivery ?? 0,
            topPerformer: jOps.topPerformer ?? null,
            avgDeliveryMinutesToday:
              typeof jOps.avgDeliveryMinutesToday === "number"
                ? jOps.avgDeliveryMinutesToday
                : null,
            liveRiders: jOps.liveRiders,
          });
        }
        if (resW.ok && Array.isArray(jW.wallets) && jW.totals) {
          setRiderWalletPayload({
            wallets: jW.wallets,
            totals: jW.totals,
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
      setFraudItems(computeFraudAlertItems());
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

  function goFindCustomer() {
    const s = customerFind.trim();
    if (!s) {
      router.push("/admin/users");
      return;
    }
    router.push(`/admin/users?q=${encodeURIComponent(s)}`);
  }

  async function settleRiderCash(uid: string) {
    setWalletBusyUid(uid);
    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/rider-wallets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "settle", riderUid: uid }),
      });
      if (!res.ok) return;
      const resW = await fetch("/api/admin/rider-wallets", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const jW = (await resW.json().catch(() => ({}))) as {
        wallets?: NonNullable<typeof riderWalletPayload>["wallets"];
        totals?: { cashWithRidersRupees: number; onlineLifetimeReportedRupees: number };
      };
      if (Array.isArray(jW.wallets) && jW.totals) {
        setRiderWalletPayload({ wallets: jW.wallets, totals: jW.totals });
      }
    } finally {
      setWalletBusyUid(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("dashboardTitle")}
        </p>
        <p className="text-sm text-slate-500">{t("dashboardSubtitle")}</p>
      </div>

      <div className="rounded-2xl border border-[#0066ff]/25 bg-gradient-to-br from-[#0066ff]/5 via-white to-slate-50 p-4 shadow-sm dark:border-[#0066ff]/35 dark:from-[#0066ff]/10 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0066ff]/15 text-[#0066ff]">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {t("dashboardFindCustomerTitle")}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {t("dashboardFindCustomerHint")}
              </p>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-md sm:flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={customerFind}
                onChange={(e) => setCustomerFind(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goFindCustomer();
                }}
                placeholder={t("dashboardFindCustomerPlaceholder")}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-950"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goFindCustomer}
                className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white hover:bg-[#0052cc]"
              >
                {t("dashboardFindCustomerCta")}
              </button>
              <Link
                href="/admin/users"
                className="text-sm font-semibold text-[#0066ff] underline-offset-2 hover:underline"
              >
                {t("dashboardFindCustomerBrowseAll")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#0066ff]" aria-hidden />
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Delivery operations
              </p>
            </div>
            {deliveryOps ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Out for delivery</p>
                    <p className="text-2xl font-extrabold tabular-nums">
                      {deliveryOps.pendingOutForDelivery}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Placed today (OFD)</p>
                    <p className="text-2xl font-extrabold tabular-nums">
                      {deliveryOps.pendingTodayPlacedOutForDelivery}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Top today</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {deliveryOps.topPerformer
                        ? `${deliveryOps.topPerformer.partnerName} (${deliveryOps.topPerformer.deliveredToday})`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Avg time (today)</p>
                    <p className="text-2xl font-extrabold tabular-nums">
                      {deliveryOps.avgDeliveryMinutesToday != null
                        ? `${deliveryOps.avgDeliveryMinutesToday.toFixed(0)}m`
                        : "—"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">Live riders</p>
                <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {deliveryOps.liveRiders.map((r) => (
                    <li
                      key={r.uid}
                      className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-slate-100 px-2 py-1 dark:border-slate-700"
                    >
                      <span className={r.disabled ? "text-slate-400 line-through" : ""}>
                        {r.name}
                        {r.dutyOnline ? (
                          <span className="ml-1 text-emerald-600">· on duty</span>
                        ) : (
                          <span className="ml-1 text-slate-400">· off</span>
                        )}
                        {r.outForDeliveryCount > 0 ? (
                          <span className="ml-1 font-mono text-[#0066ff]">
                            · OFD {r.outForDeliveryCount}
                          </span>
                        ) : null}
                      </span>
                      {r.lastLat != null && r.lastLng != null ? (
                        <a
                          href={`https://www.google.com/maps?q=${r.lastLat},${r.lastLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[#0066ff]"
                        >
                          <MapPin className="h-3 w-3" /> Map
                        </a>
                      ) : (
                        <span className="text-slate-400">No GPS</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Loading…</p>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-700 dark:text-emerald-400" aria-hidden />
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Rider wallet (COD cash-in-hand)
              </p>
            </div>
            {riderWalletPayload ? (
              <>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Cash with riders</p>
                    <p className="text-xl font-extrabold tabular-nums text-emerald-800 dark:text-emerald-200">
                      ₹{riderWalletPayload.totals.cashWithRidersRupees.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Online reported (lifetime)</p>
                    <p className="text-xl font-extrabold tabular-nums text-slate-800 dark:text-slate-100">
                      ₹{riderWalletPayload.totals.onlineLifetimeReportedRupees.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 max-h-44 space-y-1 overflow-y-auto text-xs">
                  {riderWalletPayload.wallets.map((w) => (
                    <li
                      key={w.uid}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-white/80 px-2 py-1.5 dark:border-emerald-900/40 dark:bg-slate-900/40"
                    >
                      <span className={w.disabled ? "text-slate-400 line-through" : ""}>
                        {w.name}{" "}
                        <span className="font-mono text-[10px] text-slate-500">{w.uid.slice(0, 6)}…</span>
                      </span>
                      <span className="tabular-nums font-bold">
                        ₹{w.cashInHandRupees.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        disabled={walletBusyUid === w.uid || w.cashInHandRupees <= 0 || w.disabled}
                        onClick={() => void settleRiderCash(w.uid)}
                        className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white disabled:opacity-40"
                      >
                        {walletBusyUid === w.uid ? "…" : "Settle"}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Loading…</p>
            )}
          </div>
        </div>

      {fraudItems.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/30 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-rose-900 dark:text-rose-100">
              {t("dashboardFraudAlert")}
            </p>
            <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-200/90">
              {t("dashboardFraudAlertBody", { n: fraudItems.length })}
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-rose-900/85 dark:text-rose-200/85">
              {fraudItems.map((item) => (
                <li key={fraudAlertItemKey(item)}>
                  {formatFraudAlertItem(item, t)}
                </li>
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

      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/25">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-rose-900 dark:text-rose-100">
            Inventory low-stock alerts ({invAlerts.filter((a) => a.status === "open").length})
          </p>
          <Link
            href="/admin/inventory"
            className="text-xs font-bold text-[#0066ff] hover:underline"
          >
            Open inventory ops
          </Link>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          {invAlerts
            .filter((a) => a.status === "open")
            .slice(0, 6)
            .map((a) => (
              <p key={a.alertId}>
                <span className="font-mono text-xs">{a.variantId}</span> - {a.title}{" "}
                (available {a.available}, reorder {a.reorderLevel})
              </p>
            ))}
          {invAlerts.filter((a) => a.status === "open").length === 0 ? (
            <p className="text-slate-500">No open low-stock alert.</p>
          ) : null}
        </div>
      </div>

      <AdminCustomerSync />
    </div>
  );
}
