"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { AccountOrder } from "@/lib/account-order-view";
import {
  getOrderTrackingOverride,
  type OrderTrackingPayload,
} from "@/lib/order-tracking-sync";
import { getOrCreateGraceEnd } from "@/lib/order-edit-grace";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { OrderStatusTracker } from "@/components/order-status-tracker";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, CreditCard, Receipt } from "lucide-react";
import { OrderNeedHelpChat } from "@/components/order-need-help-chat";
import { useAuth } from "@/context/auth-context";
import { Link } from "@/i18n/navigation";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { createUserReturnRequest } from "@/lib/user-returns-firestore";
import { creditWalletPaise, walletUserId } from "@/lib/wallet-storage";
import { getTaxPercent } from "@/lib/admin-security-storage";
import {
  buildOrderInvoiceForCustomer,
  openPrintableHtml,
} from "@/lib/invoice-document";

type Props = {
  order: AccountOrder;
  /** When true, use Firestore-backed step/notes (admin API), not localStorage overrides. */
  preferFirestoreTracking?: boolean;
  /** Signed-in user id — enables return request to Firestore when live orders. */
  firebaseUid?: string | null;
};

const GRACE_MINUTES = 10;

export function AccountOrderCard({
  order,
  preferFirestoreTracking = false,
  firebaseUid = null,
}: Props) {
  const t = useTranslations("account");
  const to = useTranslations("orders");
  const { user } = useAuth();
  const wUid = walletUserId(user);
  const [cancelled, setCancelled] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [graceEnd, setGraceEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [showCancelRefund, setShowCancelRefund] = useState(false);
  const [trackingOverride, setTrackingOverride] =
    useState<OrderTrackingPayload | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnBusy, setReturnBusy] = useState(false);
  const [returnMsg, setReturnMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preferFirestoreTracking) {
      setTrackingOverride(null);
      return;
    }
    const sync = () => setTrackingOverride(getOrderTrackingOverride(order.id));
    sync();
    window.addEventListener("lc-order-tracking", sync);
    return () => window.removeEventListener("lc-order-tracking", sync);
  }, [order.id, preferFirestoreTracking]);

  const effectiveStep = cancelled
    ? 0
    : preferFirestoreTracking
      ? order.step
      : (trackingOverride?.step ?? order.step);
  const canCancel = effectiveStep === 0 && !cancelled;
  const isDelivered = effectiveStep === 3 && !cancelled;

  const canSubmitReturn =
    preferFirestoreTracking &&
    Boolean(firebaseUid) &&
    isFirebaseConfigured() &&
    isDelivered;

  const deliveryFee = order.total >= 500 ? 0 : 40;
  const subtotal = Math.max(0, order.total - deliveryFee);
  const hub = order.hubCity ?? "Kolkata";

  function confirmCancel(toWallet: boolean) {
    if (!canCancel) return;
    if (toWallet) {
      creditWalletPaise(
        wUid,
        order.total * 100,
        `Refund ${order.id} → wallet`,
        { kind: "refund", orderId: order.id }
      );
    }
    setCancelled(true);
    setShowCancelRefund(false);
  }

  useEffect(() => {
    if (!canCancel) {
      setGraceEnd(null);
      return;
    }
    setGraceEnd(getOrCreateGraceEnd(order.id, GRACE_MINUTES));
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [canCancel, order.id]);

  const graceActive =
    graceEnd != null && now < graceEnd && canCancel && !cancelled;
  const secsLeft = graceEnd
    ? Math.max(0, Math.floor((graceEnd - now) / 1000))
    : 0;
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  async function submitReturnRequest() {
    if (!canSubmitReturn || !firebaseUid) return;
    const reason = returnReason.trim();
    if (reason.length < 8) {
      setReturnMsg(t("returnReasonShort"));
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setReturnMsg(t("returnFirestoreUnavailable"));
      return;
    }
    setReturnBusy(true);
    setReturnMsg(null);
    try {
      await createUserReturnRequest(db, firebaseUid, {
        orderId: order.id,
        reason,
      });
      setReturnMsg(t("returnSubmitted"));
      setReturnOpen(false);
      setReturnReason("");
    } catch {
      setReturnMsg(t("returnSubmitFailed"));
    } finally {
      setReturnBusy(false);
    }
  }

  const downloadInvoice = () => {
    const buyer =
      user?.displayName?.trim() ||
      user?.email?.trim() ||
      "Customer";
    const html = buildOrderInvoiceForCustomer({
      orderId: order.id,
      placedDate: order.date,
      buyerName: buyer,
      itemTitle: order.itemTitle,
      totalRupees: order.total,
      paymentLabel: to("paymentPaidUpi"),
      shipCity: order.hubCity,
      gstPercent: getTaxPercent(),
    });
    openPrintableHtml(html);
  };

  const locationLine = (() => {
    if (cancelled) return to("orderLocationCancelled");
    const note = preferFirestoreTracking
      ? order.timelineNote?.trim()
      : (trackingOverride?.timelineNote?.trim() ?? order.timelineNote?.trim());
    if (note) return note;
    switch (effectiveStep) {
      case 0:
        return to("orderLocation0");
      case 1:
        return to("orderLocation1", { city: hub });
      case 2:
        return to("orderLocation2", { city: hub });
      default:
        return to("orderLocation3");
    }
  })();

  const imgSrc = `https://picsum.photos/seed/${order.imageSeed}/200/200`;

  return (
    <article className="glass overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
      {/* Summary */}
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-white/60 px-3 py-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4 sm:px-5">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 dark:border-slate-600">
            <Image
              src={imgSrc}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              {order.itemTitle}
            </p>
            <p className="mt-1 break-all font-mono text-[11px] font-semibold text-slate-500 sm:text-xs dark:text-slate-400">
              {order.id}
              {cancelled ? (
                <span className="ml-2 font-sans text-rose-600 dark:text-rose-400">
                  · {t("orderCancelled")}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("placedOn")}: {order.date}
            </p>
            {effectiveStep < 3 && order.eta && order.eta !== "—" ? (
              <p className="mt-2 inline-flex max-w-full rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                {to("expectedDelivery")}: {order.eta}
              </p>
            ) : isDelivered ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {to("deliveredOn")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:ml-auto sm:w-auto sm:flex-col sm:items-end sm:justify-start sm:border-0 sm:pt-0 sm:text-right">
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            ₹{order.total.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] font-bold uppercase text-slate-400">
            {to("itemsTotal")}
          </p>
        </div>
      </div>

      {graceActive ? (
        <div className="border-b border-[#0066ff]/20 bg-[#0066ff]/[0.06] px-4 py-3 dark:border-[#0066ff]/30 dark:bg-[#0066ff]/10 sm:px-5">
          <p className="text-xs font-extrabold text-[#0066ff]">{to("graceTitle")}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {to("graceSubtitle", { minutes: String(GRACE_MINUTES) })}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/90 px-2.5 py-1 font-mono text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100">
              {to("graceTime", { m: mm, s: ss })}
            </span>
            <button
              type="button"
              onClick={() =>
                setActionBanner(to("graceEditNote"))
              }
              className="rounded-xl border border-[#0066ff]/40 bg-white px-3 py-1.5 text-xs font-bold text-[#0066ff] shadow-sm transition hover:bg-[#0066ff]/5 dark:bg-slate-900"
            >
              {to("editOrder")}
            </button>
            <button
              type="button"
              onClick={() =>
                setActionBanner(to("graceEditNote"))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {to("changeAddressQuick")}
            </button>
          </div>
          {actionBanner ? (
            <p className="mt-2 text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
              {actionBanner}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Tracker + context */}
      <div className="border-b border-slate-100 px-4 py-5 dark:border-slate-800 sm:px-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("shipmentProgress")}
        </p>
        <OrderStatusTracker
          currentStep={cancelled ? 0 : effectiveStep}
          cancelled={cancelled}
        />
        <div className="mt-4 flex gap-2 rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/50">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0066ff]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {locationLine}
            </p>
            {(() => {
              const tid = preferFirestoreTracking
                ? order.trackingId
                : trackingOverride?.trackingId;
              return tid ? (
                <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {to("trackingIdLabel", { id: tid })}
                </p>
              ) : null;
            })()}
          </div>
        </div>

        {order.refundToWallet && isDelivered ? (
          <p className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100">
            {t("refundStatusWallet", {
              amount: order.total.toLocaleString("en-IN"),
            })}
          </p>
        ) : null}
      </div>

      {/* Smart actions */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        {!cancelled && !isDelivered ? (
          <>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("trackOrder")}
            </button>
            <OrderNeedHelpChat orderId={order.id} productHint={order.itemTitle} />
          </>
        ) : null}

        {canCancel && !showCancelRefund ? (
          <button
            type="button"
            onClick={() => setShowCancelRefund(true)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {t("cancelOrder")}
          </button>
        ) : null}

        {canCancel && showCancelRefund ? (
          <div className="w-full space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/90 p-3 dark:border-rose-900/40 dark:bg-rose-950/30">
            <p className="text-xs font-bold text-rose-900 dark:text-rose-100">
              {t("cancelRefundPrompt")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => confirmCancel(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                {t("refundToWallet")}
              </button>
              <button
                type="button"
                onClick={() => confirmCancel(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {t("refundToBank")}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelRefund(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        ) : null}

        {isDelivered ? (
          <>
            <button
              type="button"
              onClick={() => {
                setReturnMsg(null);
                setReturnOpen(true);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("returnReplace")}
            </button>
            <Link
              href={`/search?q=${encodeURIComponent(order.itemTitle)}`}
              className="inline-flex items-center rounded-xl border border-[#0066ff]/35 bg-[#0066ff]/10 px-4 py-2 text-xs font-bold text-[#0066ff] transition hover:bg-[#0066ff]/15"
            >
              {to("rateReview")}
            </Link>
            <button
              type="button"
              onClick={downloadInvoice}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("downloadInvoice")}
            </button>
          </>
        ) : null}
      </div>

      {/* Accordion trigger */}
      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-[#0066ff] transition hover:bg-[#0066ff]/5 dark:hover:bg-[#0066ff]/10 sm:px-5"
        aria-expanded={detailsOpen}
      >
        {detailsOpen ? to("hideDetails") : to("viewDetails")}
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform",
            detailsOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {detailsOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="space-y-4 px-4 py-4 sm:px-5">
              {canCancel ? (
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    {to("beforeShipActions")}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-[#0066ff]/30 bg-[#0066ff]/8 px-3 py-1.5 text-xs font-bold text-[#0066ff]"
                  >
                    {t("modifyAddress")}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[#0066ff]/30 bg-[#0066ff]/8 px-3 py-1.5 text-xs font-bold text-[#0066ff]"
                  >
                    {t("changeVariant")}
                  </button>
                </div>
              ) : null}

              <div>
                <p className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <MapPin className="h-4 w-4 text-[#0066ff]" />
                  {to("billingAddress")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {to("billingSummary", { city: order.hubCity ?? "Kolkata" })}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <CreditCard className="h-4 w-4 text-[#0066ff]" />
                  {to("paymentMethod")}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {to("paymentPaidUpi")}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Receipt className="h-4 w-4 text-[#0066ff]" />
                  {to("priceBreakdown")}
                </p>
                <ul className="mt-2 space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                  <li className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{to("subtotal")}</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </li>
                  <li className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{to("deliveryLine")}</span>
                    <span>
                      {deliveryFee === 0
                        ? to("deliveryFree")
                        : `₹${deliveryFee}`}
                    </span>
                  </li>
                  <li className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 dark:border-slate-600 dark:text-slate-100">
                    <span>{to("orderTotal")}</span>
                    <span>₹{order.total.toLocaleString("en-IN")}</span>
                  </li>
                </ul>
                {!isDelivered && !cancelled ? (
                  <button
                    type="button"
                    onClick={downloadInvoice}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {t("downloadInvoice")}
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {returnOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-label={t("returnModalTitle")}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("returnModalTitle")}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">{order.id}</p>
            {!canSubmitReturn ? (
              <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
                {t("returnModalUnavailable")}
              </p>
            ) : (
              <label className="mt-3 block text-sm text-slate-700 dark:text-slate-300">
                {t("returnReasonLabel")}
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  placeholder={t("returnReasonPlaceholder")}
                />
              </label>
            )}
            {returnMsg ? (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                {returnMsg}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReturnOpen(false);
                  setReturnMsg(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold dark:border-slate-600"
              >
                {t("cancel")}
              </button>
              {canSubmitReturn ? (
                <button
                  type="button"
                  disabled={returnBusy}
                  onClick={() => void submitReturnRequest()}
                  className="rounded-xl bg-[#0066ff] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {t("returnSubmit")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
