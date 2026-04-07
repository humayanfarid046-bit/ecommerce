/** Client-side payment ledger (demo). Production: Razorpay Dashboard + your DB. */

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

const seed: RzpLedgerEntry[] = [
  {
    id: "pay_seed_1",
    razorpayOrderId: "order_OR1050demo",
    razorpayPaymentId: "pay_OR1050demo",
    orderRef: "ORD-1050",
    method: "upi",
    amountPaise: 2499_00,
    status: "captured",
    gatewayFeePaise: estimateGatewayFeePaise(2499_00, "upi"),
    netPaise: netAfterGatewayFeePaise(2499_00, "upi"),
    capturedAt: "2026-04-06T10:13:00+05:30",
    invoiceSent: true,
  },
  {
    id: "pay_seed_2",
    razorpayOrderId: "order_FAILdemo",
    razorpayPaymentId: "pay_FAILdemo",
    orderRef: "LC-DEMO-007",
    method: "card",
    amountPaise: 1500_00,
    status: "failed",
    gatewayFeePaise: 0,
    netPaise: 0,
    capturedAt: "2026-03-20T10:05:00+05:30",
    invoiceSent: false,
  },
  {
    id: "pay_seed_3",
    razorpayOrderId: "order_PENDdemo",
    razorpayPaymentId: null,
    orderRef: "LC-DEMO-PEND",
    method: "netbanking",
    amountPaise: 3200_00,
    status: "authorized",
    gatewayFeePaise: 0,
    netPaise: 0,
    capturedAt: "2026-04-06T14:00:00+05:30",
    invoiceSent: false,
  },
];

function read(): RzpLedgerEntry[] {
  if (typeof window === "undefined") return [...seed];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [...seed];
    const p = JSON.parse(raw) as RzpLedgerEntry[];
    return Array.isArray(p) && p.length ? p : [...seed];
  } catch {
    return [...seed];
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
