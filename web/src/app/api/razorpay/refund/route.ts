import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

function getKeys() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return { keyId, keySecret };
}

export async function POST(req: NextRequest) {
  const { keyId, keySecret } = getKeys();
  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        error: "Razorpay not configured",
        demo: true,
      },
      { status: 503 }
    );
  }

  let body: { paymentId?: string; amountPaise?: number | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = body.paymentId?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const opts: { amount?: number; speed?: "normal" | "optimum" } = {};
  if (body.amountPaise != null && body.amountPaise > 0) {
    opts.amount = Math.round(body.amountPaise);
  }

  try {
    const refund = await rzp.payments.refund(paymentId, opts);
    return NextResponse.json({
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Refund failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
