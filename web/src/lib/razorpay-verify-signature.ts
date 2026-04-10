import crypto from "node:crypto";

/** Razorpay Standard Checkout: HMAC-SHA256(order_id|payment_id). */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  keySecret: string
): boolean {
  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(text).digest("hex");
  return expected === razorpaySignature;
}
