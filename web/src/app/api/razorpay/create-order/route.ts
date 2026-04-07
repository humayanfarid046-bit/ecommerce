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
        error:
          "Razorpay keys missing. Set RAZORPAY_KEY_SECRET and NEXT_PUBLIC_RAZORPAY_KEY_ID in .env",
      },
      { status: 503 }
    );
  }

  let body: { amount?: number; currency?: string; receipt?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 100) {
    return NextResponse.json(
      { error: "amount must be at least 100 paise (₹1)" },
      { status: 400 }
    );
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await rzp.orders.create({
    amount,
    currency: body.currency ?? "INR",
    receipt: body.receipt ?? `rcpt_${Date.now().toString(36)}`,
    payment_capture: true,
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
  });
}
