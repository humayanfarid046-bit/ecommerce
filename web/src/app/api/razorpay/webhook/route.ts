import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appendRazorpayWebhookEntry } from "@/lib/razorpay-webhook-store";

/**
 * Razorpay webhooks: configure URL in Dashboard → Webhooks →
 * https://your-domain.com/api/razorpay/webhook
 * Events: payment.captured, payment.failed, refund.processed, settlement.processed, etc.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = await req.text();
  const sig = req.headers.get("x-razorpay-signature");

  if (secret && sig) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (expected !== sig) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else if (secret && !sig) {
    return NextResponse.json({ error: "Missing x-razorpay-signature" }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  try {
    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string } };
        order?: { entity?: { id?: string } };
      };
    };
    const payEnt = payload.payload?.payment?.entity;
    const ordEnt = payload.payload?.order?.entity;
    appendRazorpayWebhookEntry({
      receivedAt,
      event: payload.event ?? "unknown",
      paymentId: payEnt?.id,
      orderId: payEnt?.order_id ?? ordEnt?.id,
    });
    if (process.env.NODE_ENV === "development") {
      console.info("[razorpay webhook]", payload.event, payEnt?.id ?? ordEnt?.id);
    }
  } catch {
    appendRazorpayWebhookEntry({
      receivedAt,
      event: "parse_error",
    });
  }

  return NextResponse.json({ received: true });
}
