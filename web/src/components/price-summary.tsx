"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = {
  itemTotal: number;
  /** Total delivery-related charges (delivery + COD) for simple display */
  delivery: number;
  prepaidDiscount?: number;
  couponDiscount?: number;
  walletApplied?: number;
  /** @deprecated use prepaidDiscount + couponDiscount + walletApplied */
  discount?: number;
  /** GST amount from admin tax % (checkout) */
  gstAmount?: number;
  gstPercent?: number;
  /** When set, shows delivery vs COD separately */
  deliveryFee?: number;
  codHandling?: number;
  className?: string;
};

export function PriceSummary({
  itemTotal,
  delivery,
  prepaidDiscount = 0,
  couponDiscount = 0,
  walletApplied = 0,
  discount,
  gstAmount = 0,
  gstPercent,
  deliveryFee,
  codHandling,
  className,
}: Props) {
  const t = useTranslations("cart");
  const tc = useTranslations("checkout");
  const pd =
    discount != null && discount > 0 && !prepaidDiscount && !couponDiscount
      ? discount
      : prepaidDiscount;
  const savings = pd + couponDiscount + walletApplied;
  const hasGst = gstAmount > 0 && gstPercent != null;
  const showSplitDelivery =
    deliveryFee !== undefined && codHandling !== undefined;

  const grand = Math.max(
    0,
    itemTotal +
      delivery +
      (hasGst ? gstAmount : 0) -
      savings
  );

  return (
    <div className={cn("glass space-y-3 rounded-2xl p-4", className)}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("priceDetails")}</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600 dark:text-slate-400">
          <span>{t("itemTotal")}</span>
          <span>₹{itemTotal.toLocaleString("en-IN")}</span>
        </div>
        {pd > 0 && (
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
            <span>{tc("prepaidSavingsLine")}</span>
            <span>− ₹{pd.toLocaleString("en-IN")}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
            <span>{tc("couponSavingsLine")}</span>
            <span>− ₹{couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {hasGst && (
          <div className="flex justify-between text-neutral-600 dark:text-slate-400">
            <span>
              {tc("gstLine", { pct: gstPercent ?? 0 })}
            </span>
            <span>₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {showSplitDelivery ? (
          <>
            <div className="flex justify-between text-neutral-600 dark:text-slate-400">
              <span>{t("delivery")}</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400">{t("free")}</span>
                ) : (
                  `₹${deliveryFee.toLocaleString("en-IN")}`
                )}
              </span>
            </div>
            {codHandling && codHandling > 0 ? (
              <div className="flex justify-between text-neutral-600 dark:text-slate-400">
                <span>{tc("codHandlingLine")}</span>
                <span>₹{codHandling.toLocaleString("en-IN")}</span>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex justify-between text-neutral-600 dark:text-slate-400">
            <span>{t("delivery")}</span>
            <span>
              {delivery === 0 ? (
                <span className="text-emerald-700 dark:text-emerald-400">{t("free")}</span>
              ) : (
                `₹${delivery.toLocaleString("en-IN")}`
              )}
            </span>
          </div>
        )}
        {walletApplied > 0 && (
          <div className="flex justify-between text-violet-700 dark:text-violet-300">
            <span>{tc("walletAppliedLine")}</span>
            <span>− ₹{walletApplied.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-200 pt-3 font-semibold text-slate-900 dark:border-slate-600 dark:text-slate-100">
          <span>{t("total")}</span>
          <span>₹{grand.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
