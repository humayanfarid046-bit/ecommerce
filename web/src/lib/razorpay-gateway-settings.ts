/** Admin-controlled Razorpay method visibility (demo — localStorage). */

const KEY = "lc_rzp_gateway_v1";
const INV_KEY = "lc_rzp_auto_invoice_v1";

export type RazorpayGatewaySettings = {
  upi: boolean;
  card: boolean;
  netbanking: boolean;
  wallet: boolean;
};

const DEFAULTS: RazorpayGatewaySettings = {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true,
};

export function getGatewaySettings(): RazorpayGatewaySettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<RazorpayGatewaySettings>;
    return { ...DEFAULTS, ...p };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGatewaySettings(next: RazorpayGatewaySettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-rzp-gateway"));
}

export function getAutoInvoiceEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(INV_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setAutoInvoiceEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INV_KEY, on ? "1" : "0");
  window.dispatchEvent(new CustomEvent("lc-rzp-auto-invoice"));
}
