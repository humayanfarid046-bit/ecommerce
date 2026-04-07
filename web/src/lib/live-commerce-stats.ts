/**
 * Derive dashboard numbers from the same localStorage the storefront uses
 * (demo — replace with API in production).
 */

import { getUserPaymentHistory } from "@/lib/user-payment-history";
import { aggregateWalletAnalytics } from "@/lib/wallet-storage";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type LiveCommerceStats = {
  ordersToday: number;
  revenueToday: number;
  walletBalanceTotal: number;
  paymentRecords: number;
};

export function readLiveCommerceStats(): LiveCommerceStats {
  if (typeof window === "undefined") {
    return {
      ordersToday: 0,
      revenueToday: 0,
      walletBalanceTotal: 0,
      paymentRecords: 0,
    };
  }
  const day = todayIsoDate();
  const payments = getUserPaymentHistory();
  const todayOk = payments.filter(
    (p) => p.at.startsWith(day) && p.status === "success"
  );
  const revenueToday = todayOk.reduce((s, p) => s + p.amountRupees, 0);
  const ordersToday = todayOk.length;

  const agg = aggregateWalletAnalytics();

  return {
    ordersToday,
    revenueToday,
    walletBalanceTotal: Math.round(agg.totalBalancePaise / 100),
    paymentRecords: payments.length,
  };
}
