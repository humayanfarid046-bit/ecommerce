/** Client-only: admin updates → user order tracker (demo). */

import type { OrderShipmentStep } from "@/lib/demo-orders";

export type OrderTrackingPayload = {
  /** Shipment step 0–3 (matches DemoOrder.step) */
  step: OrderShipmentStep;
  trackingId?: string;
  /** Shown on user timeline / location line */
  timelineNote?: string;
  courier?: "delhivery" | "ecom_express" | "other";
};

const KEY = "lc_order_tracking_v1";

function readAll(): Record<string, OrderTrackingPayload> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return {};
    return JSON.parse(s) as Record<string, OrderTrackingPayload>;
  } catch {
    return {};
  }
}

export function getOrderTrackingOverride(
  orderId: string
): OrderTrackingPayload | null {
  const v = readAll()[orderId];
  return v ?? null;
}

export function setOrderTracking(
  orderId: string,
  patch: Partial<OrderTrackingPayload>
): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  const prev = all[orderId] ?? { step: 0 as OrderShipmentStep };
  all[orderId] = { ...prev, ...patch };
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("lc-order-tracking"));
}

export function dispatchOrderTrackingEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lc-order-tracking"));
}

/** Map admin order status → default shipment step */
export function statusToStep(
  status: "pending" | "shipped" | "delivered" | "cancelled"
): OrderShipmentStep {
  switch (status) {
    case "pending":
      return 0;
    case "shipped":
      return 1;
    case "delivered":
      return 3;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}
