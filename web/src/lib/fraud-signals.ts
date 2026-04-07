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

function parseTime(at: string): number {
  const t = new Date(at).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function computeFraudAlerts(): FraudAlertSummary {
  if (typeof window === "undefined") {
    return { activeAlerts: 0, messages: [] };
  }

  const now = Date.now();
  const ms24h = 86400000;
  const ms7d = 7 * ms24h;
  const t24 = now - ms24h;
  const t7 = now - ms7d;

  const payments = getUserPaymentHistory();
  let failed24h = 0;
  let failed7d = 0;
  let success24h = 0;
  let success7d = 0;

  for (const p of payments) {
    const t = parseTime(p.at);
    if (p.status === "failed") {
      if (t >= t24) failed24h++;
      if (t >= t7) failed7d++;
    } else if (p.status === "success") {
      if (t >= t24) success24h++;
      if (t >= t7) success7d++;
    }
  }

  const messages: string[] = [];

  if (failed24h >= 2) {
    messages.push(
      `Multiple failed payment attempts in the last 24 hours (${failed24h}). Review Razorpay dashboard and checkout flow.`
    );
  }

  if (failed7d >= 5) {
    messages.push(
      `High count of failed payments in the last 7 days (${failed7d}).`
    );
  }

  const attempts7d = failed7d + success7d;
  if (attempts7d >= 4 && failed7d > 0) {
    const rate = failed7d / attempts7d;
    if (rate >= 0.4) {
      messages.push(
        `Elevated payment failure rate: ${Math.round(rate * 100)}% failed (${failed7d}/${attempts7d}) in 7 days.`
      );
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
        const t = parseTime(e.at ?? "");
        if (t < t24) continue;
        adminAdjust24hPaise += Math.abs(e.deltaPaise ?? 0);
      }
    } catch {
      /* skip */
    }
  }

  if (adminAdjust24hPaise >= 500_000) {
    const rupees = Math.round(adminAdjust24hPaise / 100);
    messages.push(
      `Large wallet admin adjustments in the last 24 hours (≈₹${rupees.toLocaleString("en-IN")}). Confirm each credit/debit.`
    );
  }

  const uniq = Array.from(new Set(messages));
  return { activeAlerts: uniq.length, messages: uniq };
}
