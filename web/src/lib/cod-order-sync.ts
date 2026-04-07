/** Client-only: COD confirmation + delivery OTP (demo). */

export type CodOrderMeta = {
  /** Awaiting phone confirmation before dispatch. */
  confirmation: "awaiting" | "confirmed";
  /** Last OTP entered by rider at delivery (demo). */
  deliveryOtp?: string;
  deliveryOtpAt?: string;
};

const KEY = "lc_cod_order_meta_v1";

function readAll(): Record<string, CodOrderMeta> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return {};
    return JSON.parse(s) as Record<string, CodOrderMeta>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, CodOrderMeta>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("lc-cod-order-meta"));
}

export function getCodOrderMeta(orderId: string): CodOrderMeta | null {
  return readAll()[orderId] ?? null;
}

export function patchCodOrderMeta(
  orderId: string,
  patch: Partial<CodOrderMeta>
): void {
  const all = readAll();
  const prev = all[orderId] ?? { confirmation: "awaiting" };
  all[orderId] = { ...prev, ...patch };
  writeAll(all);
}

export function confirmCodOrder(orderId: string): void {
  patchCodOrderMeta(orderId, {
    confirmation: "confirmed",
  });
}

export function setDeliveryOtp(orderId: string, otp: string): void {
  patchCodOrderMeta(orderId, {
    deliveryOtp: otp,
    deliveryOtpAt: new Date().toISOString(),
  });
}

export function getEffectiveCodConfirmation(
  orderId: string,
  seed: "awaiting" | "confirmed" | undefined
): "awaiting" | "confirmed" | undefined {
  if (seed === undefined) return undefined;
  const m = getCodOrderMeta(orderId);
  return m?.confirmation ?? seed;
}

export function getDeliveryOtp(orderId: string): string | undefined {
  return getCodOrderMeta(orderId)?.deliveryOtp;
}
