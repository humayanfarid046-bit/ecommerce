/** Legacy shape for account UI; real orders come from Firestore. */

import type { UserOrderRecord } from "@/lib/user-order-firestore";

export type OrderShipmentStep = 0 | 1 | 2 | 3;

export type DemoOrder = {
  id: string;
  date: string;
  total: number;
  step: OrderShipmentStep;
  eta?: string;
  refundToWallet?: boolean;
  itemTitle: string;
  imageSeed: number;
  hubCity?: string;
  timelineNote?: string;
  trackingId?: string;
};

export const DEMO_ORDERS: DemoOrder[] = [];

export function demoTotalSpent(): number {
  return DEMO_ORDERS.reduce((s, o) => s + o.total, 0);
}

export function demoActiveOrderCount(): number {
  return DEMO_ORDERS.filter((o) => o.step < 3).length;
}

export function demoOrderFromFirestoreRecord(r: UserOrderRecord): DemoOrder {
  const dateStr = r.placedAt
    ? r.placedAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < r.id.length; i++) {
    seed = (seed * 31 + r.id.charCodeAt(i)) % 2000;
  }
  const step: OrderShipmentStep =
    r.status === "cancelled" ? 0 : (r.shipmentStep ?? 0);
  const title =
    r.itemTitle?.trim() ||
    (r.itemCount > 0
      ? `${r.itemCount} item(s) · ${r.methodLabel}`
      : r.methodLabel || "Order");
  const eta =
    r.eta?.trim() ||
    (step >= 3 ? "—" : "—");
  return {
    id: r.id,
    date: dateStr,
    total: r.totalRupees,
    step,
    eta,
    itemTitle: title,
    imageSeed: 900 + seed,
    hubCity: r.hubCity,
    timelineNote: r.timelineNote,
    trackingId: r.trackingId,
  };
}
