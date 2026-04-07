"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CheckoutOtpModal({ open, onClose }: Props) {
  const t = useTranslations("checkout");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  function sendOtp() {
    setErr(null);
    const d = phone.replace(/\D/g, "");
    if (d.length < 10) {
      setErr(t("otpInvalidPhone"));
      return;
    }
    setSent(true);
  }

  function verify() {
    setErr(null);
    setErr(t("otpNotConfigured"));
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("otpTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
            aria-label={t("closeDialog")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t("otpHint")}
        </p>
        <label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-400">
          {t("otpPhone")}
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
            }
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="9876543210"
          />
        </label>
        {!sent ? (
          <button
            type="button"
            onClick={sendOtp}
            className="mt-4 w-full rounded-xl bg-[#0066ff] py-3 text-sm font-semibold text-white hover:bg-[#0052cc]"
          >
            {t("otpSend")}
          </button>
        ) : (
          <>
            <label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("otpCode")}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
                placeholder="123456"
              />
            </label>
            <button
              type="button"
              onClick={verify}
              className="mt-4 w-full rounded-xl bg-[#0066ff] py-3 text-sm font-semibold text-white hover:bg-[#0052cc]"
            >
              {t("otpVerify")}
            </button>
          </>
        )}
        {err ? (
          <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{err}</p>
        ) : null}
      </div>
    </div>
  );
}
