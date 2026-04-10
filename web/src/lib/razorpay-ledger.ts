/** Client-side Razorpay payment ledger mirror (localStorage). Production: also use Dashboard + your DB. */

import {
  estimateGatewayFeePaise,
  netAfterGatewayFeePaise,
} from "@/lib/razorpay-fees";

const KEY = "lc_rzp_ledger_v1";

export type RzpPaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export type RzpLedgerEntry = {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  /** Store order ref e.g. LC-xxx */
  orderRef: string;
  method: string;
  amountPaise: number;
  status: RzpPaymentStatus;
  gatewayFeePaise: number;
  netPaise: number;
  capturedAt: string;
  refundId?: string;
  refundAmountPaise?: number;
  invoiceSent?: boolean;
};

function read(): RzpLedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as RzpLedgerEntry[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(list: RzpLedgerEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("lc-rzp-ledger"));
}

export function getRzpLedger(): RzpLedgerEntry[] {
  return read();
}

export function appendCapturedPayment(
  entry: Omit<RzpLedgerEntry, "id" | "gatewayFeePaise" | "netPaise"> &
    Partial<Pick<RzpLedgerEntry, "gatewayFeePaise" | "netPaise">> & { id?: string }
) {
  const list = read();
  const id = entry.id ?? `pay_${Date.now().toString(36)}`;
  const fee = estimateGatewayFeePaise(entry.amountPaise, entry.method);
  const net = netAfterGatewayFeePaise(entry.amountPaise, entry.method);
  list.unshift({
    ...entry,
    id,
    gatewayFeePaise: entry.gatewayFeePaise ?? fee,
    netPaise: entry.netPaise ?? net,
    invoiceSent: entry.invoiceSent ?? false,
  });
  write(list);
}

export function markRefundedInLedger(
  razorpayPaymentId: string,
  refundId: string,
  refundAmountPaise: number
) {
  const list = read().map((e) =>
    e.razorpayPaymentId === razorpayPaymentId
      ? {
          ...e,
          status: "refunded" as const,
          refundId,
          refundAmountPaise,
        }
      : e
  );
  write(list);
}

export function setInvoiceSent(razorpayPaymentId: string, sent: boolean) {
  const list = read().map((e) =>
    e.razorpayPaymentId === razorpayPaymentId
      ? { ...e, invoiceSent: sent }
      : e
  );
  write(list);
}
