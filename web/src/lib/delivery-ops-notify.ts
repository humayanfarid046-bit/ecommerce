type DeliveryOpsEvent =
  | "order_placed"
  | "delivery_assigned"
  | "out_for_delivery"
  | "delivery_completed"
  | "delivery_undelivered";

type DeliveryOpsPayload = {
  event: DeliveryOpsEvent;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  riderName?: string;
  riderPhone?: string;
  eta?: string;
  note?: string;
};

/**
 * Lightweight notification bridge:
 * - push to webhook (WhatsApp/SMS gateway connector)
 * - no-op if webhook is not configured
 */
export async function notifyDeliveryOps(payload: DeliveryOpsPayload): Promise<void> {
  const webhook = process.env.DELIVERY_NOTIFICATIONS_WEBHOOK?.trim();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "ecomm-delivery",
        ts: Date.now(),
        ...payload,
      }),
      cache: "no-store",
    });
  } catch {
    // Intentionally ignore gateway failures to avoid blocking order operations.
  }
}

