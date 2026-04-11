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
  /** Local top-up when Razorpay is not configured — must stay available even if admin toggled top-up off. */
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
          externalRef: `local_wallet_${Date.now().toString(36)}`,
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
        {CHIPS.map((n) => {
          const selected = amountRupees === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setAmountRupees(n)}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm font-semibold backdrop-blur-xl transition duration-200",
                selected
                  ? "border-cyan-400/90 bg-cyan-500/15 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.45),0_0_2px_rgba(34,211,238,0.8)] ring-1 ring-cyan-400/70 backdrop-blur-md"
                  : "border-slate-200/80 bg-white/55 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl hover:bg-white/75 dark:border-white/12 dark:bg-white/[0.08] dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.12]"
              )}
            >
              ₹{n.toLocaleString("en-IN")}
            </button>
          );
        })}
      </div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {t("customAmount")}
        <div className="mt-2 overflow-hidden rounded-lg bg-slate-950 px-4 pt-3 ring-1 ring-white/10 dark:bg-[#060a12] dark:ring-white/[0.08]">
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
            className={cn(
              "w-full border-0 border-b-2 border-b-cyan-500/30 bg-transparent pb-3 font-mono text-base tabular-nums text-slate-100 outline-none transition",
              "shadow-[0_1px_0_0_rgba(34,211,238,0.2)]",
              "placeholder:text-slate-500",
              "focus:border-b-cyan-400 focus:shadow-[0_4px_28px_rgba(34,211,238,0.4)] focus:ring-0"
            )}
          />
        </div>
      </label>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {t("maxRechargeHint", { max: maxRupees.toLocaleString("en-IN") })}
      </p>
      <button
        type="button"
        disabled={busy || amountRupees < 1}
        onClick={() => void pay()}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition duration-150 ease-out",
          busy || amountRupees < 1
            ? "cursor-not-allowed bg-gradient-to-r from-slate-500 to-slate-600 opacity-80 shadow-none hover:brightness-100 active:scale-100"
            : "bg-gradient-to-r from-[#0066ff] via-[#6366f1] to-[#0891b2] shadow-[0_10px_32px_rgba(0,102,255,0.38),inset_0_1px_0_0_rgba(255,255,255,0.14)] hover:brightness-[1.06] hover:shadow-[0_12px_36px_rgba(0,102,255,0.45)] active:scale-[0.98] active:shadow-[0_6px_20px_rgba(0,102,255,0.5)] motion-reduce:active:scale-100"
        )}
      >
        <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        {busy ? t("opening") : t("addMoney")}
      </button>
    </div>
  );
}
