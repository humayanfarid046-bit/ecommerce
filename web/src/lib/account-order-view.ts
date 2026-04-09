/** Account “My orders” UI model; populated from Firestore via `user-order-firestore`. */

import type { UserOrderRecord } from "@/lib/user-order-firestore";

export type OrderShipmentStep = 0 | 1 | 2 | 3;

export type AccountOrder = {
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

export function orderFromFirestoreRecord(r: UserOrderRecord): AccountOrder {
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
  const eta = r.eta?.trim() || (step >= 3 ? "—" : "—");
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
