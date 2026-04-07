/** Demo fee model aligned with typical Razorpay India pricing (2% + GST on fee ≈ 2.36%). */

export function estimateGatewayFeePaise(
  amountPaise: number,
  method: "upi" | "card" | "netbanking" | "wallet" | string
): number {
  if (method === "upi" || method === "wallet") {
    return Math.round(amountPaise * 0); // many plans: no MDR on UPI
  }
  const base = amountPaise * 0.02;
  const withGst = base * 1.18;
  return Math.round(withGst);
}

export function netAfterGatewayFeePaise(
  amountPaise: number,
  method: string
): number {
  return Math.max(0, amountPaise - estimateGatewayFeePaise(amountPaise, method));
}
