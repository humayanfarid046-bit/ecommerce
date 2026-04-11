"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { appendCapturedPayment } from "@/lib/razorpay-ledger";
import { getAutoInvoiceEnabled } from "@/lib/razorpay-gateway-settings";
import { cn } from "@/lib/utils";

type Props = {
  amountPaise: number;
  receipt: string;
  disabled: boolean;
  onPaid: (razorpayPaymentId: string) => void;
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function RazorpayCheckoutButton({
  amountPaise,
  receipt,
  disabled,
  onPaid,
}: Props) {
  const t = useTranslations("checkout");
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const [busy, setBusy] = useState(false);

  if (!keyId || amountPaise < 100) return null;

  async function pay() {
    if (disabled || busy) return;
    setBusy(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        alert(t("razorpayScriptError"));
        return;
      }

      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: receipt.slice(0, 40),
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
      };

      if (!res.ok || !data.orderId) {
        alert(data.error ?? t("razorpayOrderError"));
        return;
      }

      const Razorpay = window.Razorpay;
      const rzp = new Razorpay({
        key: data.keyId ?? keyId,
        amount: data.amount,
        currency: data.currency ?? "INR",
        name: "Libas Collection",
        description: t("razorpayOrderDesc"),
        order_id: data.orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const v = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!v.ok) {
              alert(t("razorpayVerifyError"));
              return;
            }
            appendCapturedPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              orderRef: receipt,
              method: "razorpay",
              amountPaise,
              status: "captured",
              capturedAt: new Date().toISOString(),
              invoiceSent: getAutoInvoiceEnabled(),
            });
            onPaid(response.razorpay_payment_id);
          } finally {
            setBusy(false);
          }
        },
        theme: { color: "#0066ff" },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#0066ff]/30 bg-gradient-to-br from-[#0066ff]/[0.07] to-violet-500/[0.06] p-4 dark:border-[#0066ff]/40">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {t("razorpayCheckoutCustomerTitle")}
      </p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        {t("razorpayCheckoutCustomerSubtitle")}
      </p>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void pay()}
        className={cn(
          "mt-3 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition",
          disabled || busy
            ? "cursor-not-allowed bg-slate-400"
            : "bg-[#0d47a1] hover:bg-[#0a3d8a] dark:bg-[#1565c0]"
        )}
      >
        {busy ? t("razorpayOpening") : t("razorpayPayNow")}
      </button>
    </div>
  );
}
