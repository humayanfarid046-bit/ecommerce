"use client";

import { useEffect, useState } from "react";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import { getWallet, walletUserId, type WalletState } from "@/lib/wallet-storage";
import {
  readUpiLinks,
  writeUpiLinks,
  type UpiLinks,
} from "@/lib/payment-methods-storage";
import { readSavedCards, removeSavedCard } from "@/lib/saved-cards-storage";
import { AccountPaymentHistory } from "@/components/account-payment-history";
import { WalletRechargePanel } from "@/components/wallet-recharge-panel";
import { AccountSectionHeader } from "@/components/account-section-header";

export default function AccountPaymentsPage() {
  const t = useTranslations("account");
  const { user } = useAuth();
  const wUid = walletUserId(user);
  const [upi, setUpi] = useState<UpiLinks>({
    phonepe: "",
    gpay: "",
    genericUpi: "",
  });
  const [saved, setSaved] = useState(false);
  const [wallet, setWallet] = useState<WalletState>(() => ({
    balancePaise: 0,
    ledger: [],
  }));
  const [savedCards, setSavedCards] = useState(() => readSavedCards());

  useEffect(() => {
    setUpi(readUpiLinks());
  }, []);

  useEffect(() => {
    function sync() {
      setSavedCards(readSavedCards());
    }
    sync();
    window.addEventListener("lc-saved-cards", sync);
    return () => window.removeEventListener("lc-saved-cards", sync);
  }, []);

  useEffect(() => {
    function sync() {
      setWallet(getWallet(wUid));
    }
    sync();
    window.addEventListener("lc-wallet", sync);
    return () => window.removeEventListener("lc-wallet", sync);
  }, [wUid]);

  function saveUpi(e: React.FormEvent) {
    e.preventDefault();
    writeUpiLinks(upi);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <AccountSectionHeader
        title={t("paymentsTitle")}
        subtitle={t("paymentsSubtitle")}
      />

      <section
        id="wallet-add-money"
        className="glass rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80 sm:p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Wallet className="h-5 w-5 text-[#0066ff]" />
          {t("walletTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("giftCardsHint")}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-xl bg-gradient-to-r from-[#0066ff]/8 to-[#7c3aed]/10 px-3 py-4 dark:from-[#0066ff]/15 dark:to-[#7c3aed]/15 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              {t("storeBalance")}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              ₹{(wallet.balancePaise / 100).toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0066ff] shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-[#0066ff] dark:ring-slate-600"
          >
            {t("redeemGiftCard")}
          </button>
        </div>
        <div className="mt-6 border-t border-slate-200/80 pt-6 dark:border-slate-700/80">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {t("walletAddMoneyTitle")}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("walletAddMoneySubtitle")}
          </p>
          <div className="mt-4">
            <WalletRechargePanel />
          </div>
        </div>
        {wallet.ledger.length > 0 ? (
          <ul className="mt-6 space-y-2 border-t border-slate-200/80 pt-4 dark:border-slate-700/80">
            {wallet.ledger.slice(0, 8).map((e, i) => (
              <li
                key={`${e.at}-${i}`}
                className="flex justify-between text-xs text-slate-600 dark:text-slate-400"
              >
                <span className="line-clamp-1">{e.label}</span>
                <span
                  className={
                    e.deltaPaise >= 0 ? "text-emerald-600" : "text-rose-600"
                  }
                >
                  {e.deltaPaise >= 0 ? "+" : ""}
                  ₹{(e.deltaPaise / 100).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <AccountPaymentHistory />

      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <CreditCard className="h-5 w-5 text-[#0066ff]" />
          {t("savedCardsTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("savedCardsTokenSubtitle")}
        </p>
        {savedCards.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t("savedCardsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {savedCards.map((c) => (
              <li
                key={c.id}
                className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 px-5 py-4 dark:border-slate-700/80"
              >
                <div>
                  <p className="font-bold capitalize text-slate-900 dark:text-slate-100">
                    {c.brand}
                  </p>
                  <p className="font-mono text-sm text-slate-600 dark:text-slate-300">
                    •••• •••• •••• {c.last4}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t("cardRefLabel")}: {c.cardRef}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
                  onClick={() => {
                    removeSavedCard(c.id);
                    setSavedCards(readSavedCards());
                  }}
                >
                  {t("removeCard")}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-[#0066ff] hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          + {t("addCard")}
        </button>
      </section>

      <section className="glass rounded-2xl border border-slate-200/80 p-4 dark:border-slate-700/80 sm:p-6">
        <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Smartphone className="h-5 w-5 shrink-0 text-[#0066ff]" />
          {t("upiSectionTitle")}
        </h2>
        <form onSubmit={saveUpi} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("upiPhonepe")}
            <input
              value={upi.phonepe}
              onChange={(e) =>
                setUpi((u) => ({ ...u, phonepe: e.target.value }))
              }
              placeholder="name@ybl / phonepe"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("upiGpay")}
            <input
              value={upi.gpay}
              onChange={(e) => setUpi((u) => ({ ...u, gpay: e.target.value }))}
              placeholder="name@okaxis"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("upiGeneric")}
            <input
              value={upi.genericUpi}
              onChange={(e) =>
                setUpi((u) => ({ ...u, genericUpi: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#0066ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0052cc]"
          >
            {t("saveUpi")}
          </button>
          {saved && (
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {t("upiSaved")}
            </p>
          )}
        </form>
      </section>

    </div>
  );
}
