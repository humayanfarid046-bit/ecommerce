/**
 * Single source for checkout totals — aligns storefront with
 * admin Tax & Shipping + Shipping rules (localStorage demo).
 */

import { getTaxShippingConfig } from "@/lib/admin-security-storage";
import { computeDeliveryQuote } from "@/lib/shipping-rules-storage";

export type CheckoutPricingResult = {
  merchandiseNet: number;
  gstAmount: number;
  gstPercent: number;
  deliveryFee: number;
  codHandling: number;
  freeShippingApplied: boolean;
  matchedRuleLabel: string | null;
  /** Payable before wallet (merchandise + GST + delivery + COD). */
  subtotalBeforeWallet: number;
};

export function computeCheckoutPricingBase(input: {
  itemTotalRupees: number;
  pinDigits: string;
  isCod: boolean;
  couponDiscountRupees: number;
  prepaidDiscountRupees: number;
}): CheckoutPricingResult {
  const taxCfg = getTaxShippingConfig();
  const {
    itemTotalRupees,
    pinDigits,
    isCod,
    couponDiscountRupees,
    prepaidDiscountRupees,
  } = input;

  const merchandiseNet = Math.max(
    0,
    itemTotalRupees - couponDiscountRupees - prepaidDiscountRupees
  );
  const gstAmount = Math.round((merchandiseNet * taxCfg.taxPercent) / 100);

  const quote = computeDeliveryQuote(itemTotalRupees, pinDigits, isCod);

  const subtotalBeforeWallet =
    merchandiseNet +
    gstAmount +
    quote.deliveryFee +
    quote.codHandling;

  return {
    merchandiseNet,
    gstAmount,
    gstPercent: taxCfg.taxPercent,
    deliveryFee: quote.deliveryFee,
    codHandling: quote.codHandling,
    freeShippingApplied: quote.freeShippingApplied,
    matchedRuleLabel: quote.matchedRuleLabel,
    subtotalBeforeWallet,
  };
}
