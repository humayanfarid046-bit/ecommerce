"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAddressPinsForAdmin, type AddressPinRow } from "@/lib/address-pins-sync";
import {
  topWishlistedProductIds,
} from "@/lib/wishlist-counts-sync";
import { getProductById } from "@/lib/mock-data";
import {
  getCouponRules,
  saveCouponRules,
  type CouponDef,
} from "@/lib/checkout-coupons-storage";
import {
  getThreads,
  appendMessage,
  type SupportThread,
} from "@/lib/support-chat-sync";
import { creditWalletPaise, listWalletStorageKeys } from "@/lib/wallet-storage";
import { MapPin, Heart, Ticket, MessageSquare, Wallet, Gift } from "lucide-react";
export function AdminCustomerSync() {
  const t = useTranslations("admin");
  const [pins, setPins] = useState<AddressPinRow[]>([]);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [couponRules, setCouponRules] = useState<CouponDef[]>([]);
  const [walletDemo, setWalletDemo] = useState("");
  const [loyaltyDemo, setLoyaltyDemo] = useState("");
  const [walletTargetUid, setWalletTargetUid] = useState("guest");
  const [walletUidOptions, setWalletUidOptions] = useState<string[]>([
    "guest",
  ]);

  function refreshPins() {
    setPins(getAddressPinsForAdmin());
  }

  function refreshThreads() {
    setThreads(getThreads());
  }

  function refreshWalletUids() {
    const fromStorage = listWalletStorageKeys().map((k) =>
      k.replace("lc_wallet_v3_", "")
    );
    const merged = Array.from(
      new Set(["guest", ...fromStorage])
    );
    setWalletUidOptions(merged);
  }

  useEffect(() => {
    function onCoupons() {
      setCouponRules(getCouponRules());
    }
    refreshPins();
    refreshThreads();
    refreshWalletUids();
    setCouponRules(getCouponRules());
    window.addEventListener("lc-address-pins", refreshPins);
    window.addEventListener("lc-support-threads", refreshThreads);
    window.addEventListener("lc-coupons", onCoupons);
    window.addEventListener("lc-wallet", refreshWalletUids);
    return () => {
      window.removeEventListener("lc-address-pins", refreshPins);
      window.removeEventListener("lc-support-threads", refreshThreads);
      window.removeEventListener("lc-coupons", onCoupons);
      window.removeEventListener("lc-wallet", refreshWalletUids);
    };
  }, []);

  const topWish = topWishlistedProductIds(10);

  function saveCoupons(next: CouponDef[]) {
    saveCouponRules(next);
    setCouponRules(next);
  }

  function toggleNewUsersOnly(idx: number) {
    const next = couponRules.map((c, i) =>
      i === idx ? { ...c, newUsersOnly: !c.newUsersOnly } : c
    );
    saveCoupons(next);
  }

  function setMin500(idx: number, on: boolean) {
    const next = couponRules.map((c, i) =>
      i === idx
        ? { ...c, minOrderRupees: on ? 500 : undefined }
        : c
    );
    saveCoupons(next);
  }

  function demoWalletCredit() {
    const n = Number(walletDemo.replace(/\D/g, ""));
    if (!n || n <= 0) return;
    const uid = walletTargetUid.trim() || "guest";
    creditWalletPaise(uid, n * 100, t("walletDemoCreditLabel"), {
      kind: "admin_credit",
    });
    setWalletDemo("");
    refreshWalletUids();
  }

  function demoLoyalty() {
    const n = Number(loyaltyDemo.replace(/\D/g, ""));
    if (!n || n <= 0) return;
    const uid = walletTargetUid.trim() || "guest";
    creditWalletPaise(uid, n * 100, t("loyaltyDemoLabel"), {
      kind: "admin_credit",
    });
    setLoyaltyDemo("");
    refreshWalletUids();
  }

  const firstPin = pins[0];

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("customerSyncTitle")}
        </p>
        <p className="text-sm text-slate-500">{t("customerSyncSubtitle")}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/90 p-4 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <MapPin className="h-4 w-4 text-[#0066ff]" />
            {t("syncAddressPins")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("syncAddressPinsHint")}</p>
          {firstPin ? (
            <div className="mt-3 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://staticmap.openstreetmap.de/staticmap.php?center=${firstPin.lat},${firstPin.lng}&zoom=13&size=640x240&maptype=mapnik`}
                alt=""
                className="w-full rounded-lg border border-slate-200 object-cover dark:border-slate-600"
              />
              <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-slate-600 dark:text-slate-400">
                {pins.map((p) => (
                  <li key={p.id}>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.label}
                    </span>{" "}
                    — {p.line1}, {p.city} ({p.pin})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("syncNoPins")}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/90 p-4 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Heart className="h-4 w-4 text-rose-500" />
            {t("syncTopWishlist")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("syncTopWishlistHint")}</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {topWish.map(({ id, count }) => {
              const p = getProductById(id);
              return (
                <li key={id}>
                  <span className="font-medium">{p?.title ?? id}</span>{" "}
                  <span className="text-slate-500">× {count}</span>
                </li>
              );
            })}
          </ol>
          {topWish.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("syncNoWishlist")}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/90 p-4 dark:border-slate-700">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Ticket className="h-4 w-4 text-amber-600" />
          {t("syncCouponRules")}
        </h3>
        <ul className="mt-3 space-y-3">
          {couponRules.map((c, idx) => (
            <li
              key={`${c.code}-${idx}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50"
            >
              <span className="font-mono font-bold">{c.code}</span>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(c.newUsersOnly)}
                  onChange={() => toggleNewUsersOnly(idx)}
                />
                {t("couponNewUsersOnly")}
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={c.minOrderRupees === 500}
                  onChange={(e) => setMin500(idx, e.target.checked)}
                />
                {t("couponMin500")}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200/90 p-4 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Wallet className="h-4 w-4 text-emerald-600" />
            {t("syncWalletDemo")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("syncWalletDemoHint")}</p>
          <label className="mt-3 block text-[11px] font-semibold uppercase text-slate-500">
            {t("syncWalletTargetUid")}
            <input
              list="wallet-uid-options"
              value={walletTargetUid}
              onChange={(e) => setWalletTargetUid(e.target.value.trim())}
              placeholder="demo-local-user · guest · Firebase UID…"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <datalist id="wallet-uid-options">
              {walletUidOptions.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={walletDemo}
              onChange={(e) => setWalletDemo(e.target.value)}
              placeholder="₹"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={demoWalletCredit}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              {t("syncWalletCredit")}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Gift className="h-4 w-4 text-violet-600" />
            <input
              value={loyaltyDemo}
              onChange={(e) => setLoyaltyDemo(e.target.value)}
              placeholder={t("loyaltyPlaceholder")}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={demoLoyalty}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              {t("syncLoyaltyGift")}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 p-4 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <MessageSquare className="h-4 w-4 text-[#0066ff]" />
            {t("syncSupportThreads")}
          </h3>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-xs">
            {threads.map((th) => (
              <li
                key={th.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {th.orderId}
                </p>
                <p className="text-slate-500">{th.userEmail}</p>
                {th.productHint ? (
                  <p className="text-slate-600 dark:text-slate-400">{th.productHint}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    appendMessage(
                      th.id,
                      "admin",
                      t("syncAdminReplyDemo")
                    );
                    refreshThreads();
                  }}
                  className="mt-2 text-[11px] font-bold text-[#0066ff] hover:underline"
                >
                  {t("syncSendDemoReply")}
                </button>
              </li>
            ))}
          </ul>
          {threads.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("syncNoThreads")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
