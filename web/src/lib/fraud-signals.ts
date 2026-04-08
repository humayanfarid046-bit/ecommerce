/**
 * Lightweight fraud / risk signals from the same browser's payment + wallet data.
 * Same limits as the rest of the storefront: client-only; replace with server rules for scale.
 */

import { getUserPaymentHistory } from "@/lib/user-payment-history";
import { listWalletStorageKeys } from "@/lib/wallet-storage";

export type FraudAlertSummary = {
  activeAlerts: number;
  messages: string[];
};

/** Structured alerts for i18n (dashboard, admin users). */
export type FraudAlertItem =
  | { kind: "failed_payments_24h"; count: number }
  | { kind: "failed_payments_7d"; count: number }
  | {
      kind: "elevated_failure_rate";
      failed: number;
      attempts: number;
      ratePct: number;
    }
  | { kind: "wallet_admin_adjustment"; rupees: number };

export function fraudAlertItemKey(item: FraudAlertItem): string {
  switch (item.kind) {
    case "failed_payments_24h":
      return `f24-${item.count}`;
    case "failed_payments_7d":
      return `f7-${item.count}`;
    case "elevated_failure_rate":
      return `rate-${item.failed}-${item.attempts}-${item.ratePct}`;
    case "wallet_admin_adjustment":
      return `w-${item.rupees}`;
  }
}

/** Map one alert to a translated string (pass `useTranslations("admin")`). */
export function formatFraudAlertItem(
  item: FraudAlertItem,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  switch (item.kind) {
    case "failed_payments_24h":
      return t("fraudMsgFailed24", { count: item.count });
    case "failed_payments_7d":
      return t("fraudMsgFailed7", { count: item.count });
    case "elevated_failure_rate":
      return t("fraudMsgFailureRate", {
        ratePct: item.ratePct,
        failed: item.failed,
        attempts: item.attempts,
      });
    case "wallet_admin_adjustment":
      return t("fraudMsgWalletAdmin", { rupees: item.rupees });
    default:
      return "";
  }
}

function parseTime(at: string): number {
  const t = new Date(at).getTime();
  return Number.isFinite(t) ? t : 0;
}

function itemToEnglish(item: FraudAlertItem): string {
  switch (item.kind) {
    case "failed_payments_24h":
      return `Multiple failed payment attempts in the last 24 hours (${item.count}). Review Razorpay dashboard and checkout flow.`;
    case "failed_payments_7d":
      return `High count of failed payments in the last 7 days (${item.count}).`;
    case "elevated_failure_rate":
      return `Elevated payment failure rate: ${item.ratePct}% failed (${item.failed}/${item.attempts}) in 7 days.`;
    case "wallet_admin_adjustment":
      return `Large wallet admin adjustments in the last 24 hours (≈₹${item.rupees.toLocaleString("en-IN")}). Confirm each credit/debit.`;
    default:
      return "";
  }
}

/**
 * Live risk signals from local payment history + wallet admin ledger (this browser).
 * Recomputes when `lc-user-payment-history`, `lc-wallet`, or `storage` fires (see admin dashboard).
 */
export function computeFraudAlertItems(): FraudAlertItem[] {
  if (typeof window === "undefined") return [];

  const now = Date.now();
  const ms24h = 86400000;
  const ms7d = 7 * ms24h;
  const t24 = now - ms24h;
  const t7 = now - ms7d;

  const payments = getUserPaymentHistory();
  let failed24h = 0;
  let failed7d = 0;
  let success7d = 0;

  for (const p of payments) {
    const time = parseTime(p.at);
    if (p.status === "failed") {
      if (time >= t24) failed24h++;
      if (time >= t7) failed7d++;
    } else if (p.status === "success") {
      if (time >= t7) success7d++;
    }
  }

  const items: FraudAlertItem[] = [];

  if (failed24h >= 2) {
    items.push({ kind: "failed_payments_24h", count: failed24h });
  }

  if (failed7d >= 5) {
    items.push({ kind: "failed_payments_7d", count: failed7d });
  }

  const attempts7d = failed7d + success7d;
  if (attempts7d >= 4 && failed7d > 0) {
    const rate = failed7d / attempts7d;
    if (rate >= 0.4) {
      items.push({
        kind: "elevated_failure_rate",
        failed: failed7d,
        attempts: attempts7d,
        ratePct: Math.round(rate * 100),
      });
    }
  }

  let adminAdjust24hPaise = 0;
  for (const key of listWalletStorageKeys()) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const w = JSON.parse(raw) as {
        ledger?: Array<{ at?: string; deltaPaise?: number; kind?: string }>;
      };
      for (const e of w.ledger ?? []) {
        if (e.kind !== "admin_credit" && e.kind !== "admin_debit") continue;
        const time = parseTime(e.at ?? "");
        if (time < t24) continue;
        adminAdjust24hPaise += Math.abs(e.deltaPaise ?? 0);
      }
    } catch {
      /* skip */
    }
  }

  if (adminAdjust24hPaise >= 500_000) {
    const rupees = Math.round(adminAdjust24hPaise / 100);
    items.push({ kind: "wallet_admin_adjustment", rupees });
  }

  return items;
}

/** @deprecated Prefer computeFraudAlertItems + formatFraudAlertItem for i18n. */
export function computeFraudAlerts(): FraudAlertSummary {
  if (typeof window === "undefined") {
    return { activeAlerts: 0, messages: [] };
  }
  const items = computeFraudAlertItems();
  const messages = items.map(itemToEnglish).filter(Boolean);
  const uniq = Array.from(new Set(messages));
  return { activeAlerts: uniq.length, messages: uniq };
}
