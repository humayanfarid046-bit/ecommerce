"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { getGatewaySettings } from "@/lib/razorpay-gateway-settings";
import { RazorpayCheckoutButton } from "@/components/razorpay-checkout-button";
import {
  CheckoutOmnichannelBanner,
  CheckoutSavedCardsNote,
  CheckoutWebOtpHint,
} from "@/components/checkout-payment-ux-blocks";
import type { SavedCard } from "@/lib/saved-cards-storage";
import { PaymentMethodIcons } from "@/components/payment-method-icons";
import { RippleButton } from "@/components/ripple-button";
import {
  Wallet,
  Building2,
  Banknote,
  CreditCard,
  Shield,
  Check,
  Sparkles,
  MessageCircle,
  Smartphone,
} from "lucide-react";

type Props = {
  payKey: string;
  setPayKey: (k: string) => void;
  savedCards: SavedCard[];
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvv: string;
  setCardCvv: (v: string) => void;
  cardName: string;
  setCardName: (v: string) => void;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
  whatsappUpdates: boolean;
  setWhatsappUpdates: (v: boolean) => void;
  paymentValid: () => boolean;
  canPlaceAddress: boolean;
  processingLocked: boolean;
  onPay: () => void;
  grandTotalRupees?: number;
  receiptId?: string;
  onRazorpayPaid?: (paymentId: string) => void;
};

function cardBrandStyle(brand: SavedCard["brand"]) {
  switch (brand) {
    case "visa":
      return "from-[#1a1f71] to-[#1434cb]";
    case "mastercard":
      return "from-[#eb001b] to-[#f79e1b]";
    case "rupay":
      return "from-[#097939] to-[#0a6ebd]";
    default:
      return "from-slate-600 to-slate-800";
  }
}

export function CheckoutPaymentStep({
  payKey,
  setPayKey,
  savedCards,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardName,
  setCardName,
  saveCard,
  setSaveCard,
  whatsappUpdates,
  setWhatsappUpdates,
  paymentValid,
  canPlaceAddress,
  processingLocked,
  onPay,
  grandTotalRupees = 0,
  receiptId = "checkout",
  onRazorpayPaid,
}: Props) {
  const t = useTranslations("checkout");
  const [gw, setGw] = useState(() => getGatewaySettings());

  useEffect(() => {
    setGw(getGatewaySettings());
    function sync() {
      setGw(getGatewaySettings());
    }
    window.addEventListener("lc-rzp-gateway", sync);
    return () => window.removeEventListener("lc-rzp-gateway", sync);
  }, []);

  const upiOptions = [
    ["upi_gpay", "payGpay", "from-[#4285f4] to-[#34a853]"] as const,
    ["upi_phonepe", "payPhonepe", "from-[#5f259f] to-[#7c3aed]"] as const,
    ["upi_paytm", "payPaytm", "from-[#00baf2] to-[#0d47a1]"] as const,
  ];

  const canPay =
    canPlaceAddress && paymentValid() && !processingLocked;

  const rzpPaise = Math.round(grandTotalRupees * 100);
  const showRzp =
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    onRazorpayPaid &&
    payKey !== "cod" &&
    rzpPaise >= 100;

  return (
    <div className="space-y-5 border-t border-neutral-200/80 p-4 pt-5 dark:border-slate-700 sm:p-5">
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <PaymentMethodIcons />
      </div>

      {showRzp && onRazorpayPaid ? (
        <RazorpayCheckoutButton
          amountPaise={rzpPaise}
          receipt={receiptId}
          disabled={!canPay}
          onPaid={onRazorpayPaid}
        />
      ) : null}

      <CheckoutOmnichannelBanner />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/50 px-4 py-3 text-sm dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/20">
        <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="font-medium text-emerald-950 dark:text-emerald-100">
          {t("prepaidDiscountHint")}
        </p>
      </div>

      <CheckoutWebOtpHint />

      {/* UPI */}
      {gw.upi ? (
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            <Smartphone className="h-4 w-4 text-[#0066ff]" />
            {t("upiSection")}
          </h3>
          <span className="rounded-full bg-[#0066ff]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0066ff]">
            {t("upiRecommended")}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {upiOptions.map(([key, labelKey, gradient], i) => {
            const selected = payKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPayKey(key)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition",
                  selected
                    ? "border-[#0066ff] bg-[#0066ff]/[0.08] shadow-[0_8px_28px_rgba(0,102,255,0.18)] dark:bg-[#0066ff]/15"
                    : "border-neutral-200/90 bg-white hover:border-[#0066ff]/40 dark:border-slate-700 dark:bg-slate-900/60"
                )}
              >
                {selected ? (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0066ff] text-white shadow-md">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white shadow-inner",
                    gradient
                  )}
                >
                  {key === "upi_gpay" ? "G" : key === "upi_phonepe" ? "Pe" : "Py"}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t(labelKey)}
                </span>
                {i === 0 ? (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                    {t("fastest")}
                  </span>
                ) : (
                  <span className="h-3" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setPayKey("upi_any")}
          className={cn(
            "mt-3 flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition",
            payKey === "upi_any"
              ? "border-[#0066ff] bg-[#0066ff]/8 dark:bg-[#0066ff]/15"
              : "border-neutral-200/90 bg-white hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900/50"
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("upiAny")}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("upiAnyHint")}
            </p>
          </div>
          {payKey === "upi_any" ? (
            <Check className="h-5 w-5 shrink-0 text-[#0066ff]" />
          ) : null}
        </button>
      </section>
      ) : null}

      {/* Cards */}
      {gw.card ? (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <CreditCard className="h-4 w-4 text-[#0066ff]" />
          {t("cardsSection")}
        </h3>
        <CheckoutSavedCardsNote />
        {savedCards.length > 0 ? (
          <ul className="mb-3 space-y-2">
            {savedCards.map((c) => {
              const sel = payKey === `card_saved_${c.id}`;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setPayKey(`card_saved_${c.id}`)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition",
                      sel
                        ? "border-[#0066ff] bg-[#0066ff]/5 dark:bg-[#0066ff]/10"
                        : "border-neutral-200/80 hover:border-[#0066ff]/30 dark:border-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[9px] font-black uppercase leading-tight text-white shadow-sm",
                        cardBrandStyle(c.brand)
                      )}
                    >
                      {c.brand === "visa"
                        ? "VISA"
                        : c.brand === "mastercard"
                          ? "MC"
                          : "RuPay"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                        •••• {c.last4}
                      </p>
                      <p className="text-xs text-neutral-500">{t("savedCardHint")}</p>
                    </div>
                    {sel ? (
                      <Check className="h-5 w-5 shrink-0 text-[#0066ff]" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={() => setPayKey("card_new")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition",
            payKey === "card_new"
              ? "border-[#0066ff] bg-[#0066ff]/5"
              : "border-dashed border-neutral-300 dark:border-slate-600"
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <CreditCard className="h-5 w-5 text-slate-600" />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("cardNew")}
          </span>
          {payKey === "card_new" ? (
            <Check className="ml-auto h-5 w-5 text-[#0066ff]" />
          ) : null}
        </button>

        {payKey === "card_new" ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-xl dark:border-slate-600">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/60">
              {t("cardSecureFields")}
            </p>
            <label className="block">
              <span className="sr-only">{t("cardNumber")}</span>
              <input
                placeholder={t("cardNumber")}
                value={cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ").trim()}
                onChange={(e) =>
                  setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))
                }
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-3 font-mono text-base tracking-widest text-white placeholder:text-white/40 focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/40"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/40 focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/40"
              />
              <input
                placeholder="CVV"
                value={cardCvv}
                onChange={(e) =>
                  setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/40 focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/40"
              />
            </div>
            <input
              placeholder={t("cardName")}
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/40"
            />
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-white/85">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="h-4 w-4 rounded border-white/30 text-[#0066ff] focus:ring-[#0066ff]"
              />
              {t("saveCardFuture")}
            </label>
          </div>
        ) : null}
      </section>
      ) : null}

      {/* Net banking */}
      {gw.netbanking ? (
      <button
        type="button"
        onClick={() => setPayKey("netbanking")}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition",
          payKey === "netbanking"
            ? "border-[#0066ff] bg-[#0066ff]/8 dark:bg-[#0066ff]/15"
            : "border-neutral-200/90 bg-white dark:border-slate-700 dark:bg-slate-900/50"
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("paymentNet")}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("netbankingHint")}
          </p>
        </div>
        {payKey === "netbanking" ? (
          <Check className="h-5 w-5 shrink-0 text-[#0066ff]" />
        ) : null}
      </button>
      ) : null}

      {/* COD — last */}
      <div className="rounded-2xl border-2 border-dashed border-amber-400/60 bg-gradient-to-br from-amber-50 to-orange-50/80 p-4 dark:border-amber-700/50 dark:from-amber-950/40 dark:to-orange-950/30">
        <button
          type="button"
          onClick={() => setPayKey("cod")}
          className="flex w-full items-start gap-3 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
            <Banknote className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
              {t("paymentCod")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/85 dark:text-amber-200/90">
              {t("codLastHint")}
            </p>
          </div>
          <span
            className={cn(
              "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
              payKey === "cod"
                ? "border-[#0066ff] bg-[#0066ff] text-white"
                : "border-amber-400/80"
            )}
          >
            {payKey === "cod" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
          </span>
        </button>
      </div>

      <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          {t("paymentFailureRefund")}
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3.5 transition hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/35">
        <input
          type="checkbox"
          checked={whatsappUpdates}
          onChange={(e) => setWhatsappUpdates(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-[#0066ff] focus:ring-[#0066ff]"
        />
        <span className="flex items-start gap-2">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {t("whatsappUpdates")}
          </span>
        </span>
      </label>

      {showRzp ? (
        <div className="rounded-2xl border border-[#0066ff]/35 bg-[#0066ff]/[0.06] px-4 py-4 text-center text-sm leading-relaxed text-slate-700 dark:border-[#0066ff]/40 dark:bg-[#0066ff]/10 dark:text-slate-200">
          {t("razorpayRequiredHint")}
        </div>
      ) : (
        <RippleButton
          type="button"
          disabled={!canPay}
          onClick={onPay}
          rippleClassName="bg-white/35"
          className={cn(
            "w-full rounded-[12px] py-4 text-base font-bold text-white transition",
            canPay
              ? "bg-[#2563eb] shadow-[0_8px_32px_rgba(37,99,235,0.2)] hover:bg-[#1d4ed8]"
              : "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
          )}
        >
          {t("payAndPlace")}
        </RippleButton>
      )}
    </div>
  );
}
