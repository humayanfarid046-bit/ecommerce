/** In-memory ring buffer for Razorpay webhook events (serverless instance lifetime). */

export type RazorpayWebhookEntry = {
  receivedAt: string;
  event: string;
  paymentId?: string;
  orderId?: string;
};

const MAX = 200;

const g = globalThis as typeof globalThis & {
  __rzpWebhookBuffer?: RazorpayWebhookEntry[];
};

function buffer(): RazorpayWebhookEntry[] {
  if (!g.__rzpWebhookBuffer) g.__rzpWebhookBuffer = [];
  return g.__rzpWebhookBuffer;
}

export function appendRazorpayWebhookEntry(entry: RazorpayWebhookEntry): void {
  const b = buffer();
  b.push(entry);
  while (b.length > MAX) b.shift();
}
