/** Coupon rules for checkout + admin (stored in localStorage). */

export type CouponDef = {
  code: string;
  label: string;
  discountPct: number;
  newUsersOnly?: boolean;
  /** Minimum cart total in ₹ (not paise). */
  minOrderRupees?: number;
};

const KEY = "lc_coupon_rules_v1";

const DEFAULTS: CouponDef[] = [
  {
    code: "WELCOME10",
    label: "Welcome 10%",
    discountPct: 10,
    newUsersOnly: true,
  },
  {
    code: "CART500",
    label: "₹500+ orders — 5%",
    discountPct: 5,
    minOrderRupees: 500,
  },
  {
    code: "SAVE15",
    label: "Extra 15% (all)",
    discountPct: 15,
  },
];

function read(): CouponDef[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return DEFAULTS;
    const p = JSON.parse(s) as CouponDef[];
    return Array.isArray(p) && p.length ? p : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function getCouponRules(): CouponDef[] {
  return read();
}

export function saveCouponRules(rules: CouponDef[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rules));
  window.dispatchEvent(new CustomEvent("lc-coupons"));
}

/** `orderCount` from localStorage — 0 = new user for coupon rules */
export function getApplicableCoupons(
  cartTotalRupees: number,
  opts: { orderCount?: number } = {}
): CouponDef[] {
  const rules = read();
  const oc =
    opts.orderCount ??
    Number(
      typeof window !== "undefined"
        ? localStorage.getItem("lc_completed_order_count") ??
            localStorage.getItem("lc_demo_order_count") ??
            "0"
        : "0"
    );
  const isNewUser = oc === 0;
  return rules.filter((c) => {
    if (c.newUsersOnly && !isNewUser) return false;
    if (c.minOrderRupees != null && cartTotalRupees < c.minOrderRupees)
      return false;
    return true;
  });
}
