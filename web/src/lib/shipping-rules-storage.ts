/** Client-only: dynamic delivery rules (demo — replace with API). */

export type PinShippingRule = {
  pinPrefix: string;
  label: string;
  fee: number;
};

export type ShippingRulesState = {
  /** Cart subtotal ≥ this → ₹0 delivery (before COD fee). */
  freeShippingMin: number;
  /** Delivery fee when subtotal &lt; freeShippingMin (before PIN override). */
  feeBelowMin: number;
  /** If no PIN rule matches, use this delivery fee (when below free threshold). */
  defaultPinFee: number;
  pinRules: PinShippingRule[];
  /** Added only when payment method is COD. */
  codHandlingFee: number;
};

const KEY = "lc_shipping_rules_v1";

export const defaultShippingRules: ShippingRulesState = {
  freeShippingMin: 500,
  feeBelowMin: 50,
  defaultPinFee: 40,
  pinRules: [
    { pinPrefix: "700", label: "Kolkata", fee: 60 },
    { pinPrefix: "721", label: "Murshidabad area", fee: 20 },
    { pinPrefix: "110", label: "Delhi NCR", fee: 55 },
  ],
  codHandlingFee: 10,
};

function read(): ShippingRulesState {
  if (typeof window === "undefined") return defaultShippingRules;
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return defaultShippingRules;
    const p = JSON.parse(s) as ShippingRulesState;
    return {
      ...defaultShippingRules,
      ...p,
      pinRules: Array.isArray(p.pinRules) ? p.pinRules : defaultShippingRules.pinRules,
    };
  } catch {
    return defaultShippingRules;
  }
}

export function getShippingRules(): ShippingRulesState {
  return read();
}

export function saveShippingRules(next: ShippingRulesState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-shipping-rules"));
}

export function dispatchShippingRulesEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lc-shipping-rules"));
}

/** Longest-prefix match on PIN (up to 6 digits). */
function matchPinRule(
  pin: string,
  rules: PinShippingRule[]
): { fee: number; label: string } | null {
  const p = pin.replace(/\D/g, "").slice(0, 6);
  if (!p) return null;
  let best: { len: number; fee: number; label: string } | null = null;
  for (const r of rules) {
    const pref = r.pinPrefix.replace(/\D/g, "");
    if (!pref || !p.startsWith(pref)) continue;
    if (!best || pref.length > best.len) {
      best = { len: pref.length, fee: r.fee, label: r.label };
    }
  }
  return best ? { fee: best.fee, label: best.label } : null;
}

/**
 * @param subtotal — merchandise before delivery/COD
 * @param pin — customer PIN
 * @param isCod — if true, adds codHandlingFee
 */
export function computeDeliveryQuote(
  subtotal: number,
  pin: string,
  isCod: boolean
): {
  deliveryFee: number;
  codHandling: number;
  freeShippingApplied: boolean;
  matchedRuleLabel: string | null;
} {
  const rules = getShippingRules();
  const free = subtotal >= rules.freeShippingMin;
  let deliveryFee = 0;
  let matchedLabel: string | null = null;
  if (!free) {
    const hit = matchPinRule(pin, rules.pinRules);
    if (hit) {
      deliveryFee = hit.fee;
      matchedLabel = hit.label;
    } else {
      deliveryFee = rules.feeBelowMin > 0 ? rules.feeBelowMin : rules.defaultPinFee;
    }
  }
  const codHandling = isCod ? rules.codHandlingFee : 0;
  return {
    deliveryFee,
    codHandling,
    freeShippingApplied: free,
    matchedRuleLabel: matchedLabel,
  };
}
