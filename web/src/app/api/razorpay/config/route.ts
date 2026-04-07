import { NextResponse } from "next/server";

export async function GET() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
  const hasWebhook = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);

  const preview =
    keyId && keyId.length > 8
      ? `${keyId.slice(0, 6)}…${keyId.slice(-4)}`
      : keyId ?? "";

  return NextResponse.json({
    configured: Boolean(keyId && hasSecret),
    keyIdPreview: preview,
    webhookConfigured: hasWebhook,
  });
}
