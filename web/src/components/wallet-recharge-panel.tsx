"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import { creditWalletPaise, walletUserId } from "@/lib/wallet-storage";
import { getWalletGlobalSettings } from "@/lib/wallet-settings";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const CHIPS = [100, 500, 1000] as const;

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

export function WalletRechargePanel() {
  const t = useTranslations("wallet");
  const { user } = useAuth();
  const uid = walletUserId(user);
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const [amountRupees, setAmountRupees] = useState(500);
  const [busy, setBusy] = useState(false);
  const [gw, setGw] = useState(() => getWalletGlobalSettings());

  useEffect(() => {
    function sync() {
      setGw(getWalletGlobalSettings());
    }
    window.addEventListener("lc-wallet-settings", sync);
    return () => window.removeEventListener("lc-wallet-settings", sync);
  }, []);

  const maxRupees = Math.max(1, Math.floor(gw.maxRechargePaise / 100));
  const useRazorpay = Boolean(keyId);
  /** Demo (no Razorpay key) must stay available even if admin toggled top-up off. */
  const topUpEnabled = !useRazorpay || gw.walletTopUpEnabled;

  const pay = useCallback(async () => {
    if (!topUpEnabled || busy) return;
    const rupees = Math.min(Math.max(1, amountRupees), maxRupees);
    const paise = rupees * 100;
    if (paise < 100) return;

    setBusy(true);
    try {
      if (!useRazorpay) {
        creditWalletPaise(uid, paise, t("rechargeCreditLabel"), {
          kind: "recharge",
          externalRef: "demo_local",
        });
        setBusy(false);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        alert(t("razorpayScriptError"));
        setBusy(false);
        return;
      }

      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paise,
          currency: "INR",
          receipt: `wallet_${uid.slice(0, 12)}_${Date.now().toString(36)}`.slice(
            0,
            40
          ),
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
        setBusy(false);
        return;
      }

      const Razorpay = window.Razorpay;
      const rzp = new Razorpay({
        key: data.keyId ?? keyId,
        amount: data.amount,
        currency: data.currency ?? "INR",
        name: "Libas Collection",
        description: t("rechargeDescription"),
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
            creditWalletPaise(uid, paise, t("rechargeCreditLabel"), {
              kind: "recharge",
              externalRef: response.razorpay_payment_id,
            });
          } finally {
            setBusy(false);
          }
        },
        theme: { color: "#2874f0" },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch {
      setBusy(false);
    }
  }, [topUpEnabled, busy, amountRupees, maxRupees, uid, keyId, t, useRazorpay]);

  if (!topUpEnabled) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        {t("topUpDisabledAdmin")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!useRazorpay ? (
        <p className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/20 dark:text-sky-100">
          {t("demoModeHint")}
        </p>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("quickAmounts")}
      </p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAmountRupees(n)}
            className={cn(
              "rounded-xl border-2 px-4 py-2 text-sm font-bold transition",
              amountRupees === n
                ? "border-[#2874f0] bg-[#2874f0]/10 text-[#2874f0]"
                : "border-[#E5E7EB] bg-white text-slate-800 hover:border-[#2874f0]/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            )}
          >
            ₹{n.toLocaleString("en-IN")}
          </button>
        ))}
      </div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {t("customAmount")}
        <input
          type="number"
          min={1}
          max={maxRupees}
          value={amountRupees || ""}
          onChange={(e) =>
            setAmountRupees(
              Math.min(
                maxRupees,
                Math.max(1, Number(e.target.value) || 0)
              )
            )
          }
          className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 font-mono text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {t("maxRechargeHint", { max: maxRupees.toLocaleString("en-IN") })}
      </p>
      <button
        type="button"
        disabled={busy || amountRupees < 1}
        onClick={() => void pay()}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition sm:w-auto sm:px-8",
          busy || amountRupees < 1
            ? "cursor-not-allowed bg-slate-400"
            : "bg-[#2874f0] hover:bg-[#1a65d8]"
        )}
      >
        <Plus className="h-4 w-4" />
        {busy ? t("opening") : t("addMoney")}
      </button>
    </div>
  );
}
