"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useAddresses } from "@/context/addresses-context";
import { getProductById, type Product } from "@/lib/storefront-catalog";
import { PriceSummary } from "@/components/price-summary";
import { CheckoutProgress } from "@/components/checkout-progress";
import { CheckoutProcessingOverlay } from "@/components/checkout-processing-overlay";
import { CheckoutAddressEditDialog } from "@/components/checkout-address-edit-dialog";
import { CheckoutAddressStep } from "@/components/checkout-address-step";
import { CheckoutOtpModal } from "@/components/checkout-otp-modal";
import { CheckoutPaymentStep } from "@/components/checkout-payment-step";
import { applyPinLookupIfNew } from "@/lib/pin-lookup";
import {
  markCheckoutEntered,
  markCheckoutLeftWithoutOrder,
  clearCheckoutRecovery,
} from "@/lib/checkout-recovery";
import { addSavedCard, readSavedCards } from "@/lib/saved-cards-storage";
import { addCalendarDays } from "@/lib/product-trust";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import { RippleButton } from "@/components/ripple-button";
import type { SavedAddress } from "@/lib/saved-address";
import { computeCheckoutPricingBase } from "@/lib/checkout-pricing";
import {
  getApplicableCoupons,
  type CouponDef,
} from "@/lib/checkout-coupons-storage";
import {
  getWallet,
  debitWalletPaise,
  walletUserId,
} from "@/lib/wallet-storage";
import { getWalletGlobalSettings } from "@/lib/wallet-settings";
import { recordUserPayment } from "@/lib/user-payment-history";
import {
  canUseFirestoreSync,
  getFirebaseAuth,
  getFirebaseDb,
} from "@/lib/firebase/client";
import { setAdminOrderFirebaseUid } from "@/lib/admin-order-firebase-uid";
import { saveUserOrderToFirestore } from "@/lib/user-order-firestore";
import { prependOrderPlacedNotification } from "@/lib/notifications-storage";
import { effectiveLineTotalRupees } from "@/lib/category-discount-storage";

const ORDER_COUNT_KEY = "lc_completed_order_count";

function formatEta(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function CheckoutShell() {
  const { items, clear } = useCart();
  const { user, status: authStatus } = useAuth();
  const { addresses, update } = useAddresses();
  const t = useTranslations("checkout");

  const completedRef = useRef(false);
  const guestPinLookupRef = useRef<string>("");
  const [addrId, setAddrId] = useState("");
  const [useGuestForm, setUseGuestForm] = useState(() => addresses.length === 0);

  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestLine1, setGuestLine1] = useState("");
  const [guestPin, setGuestPin] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestState, setGuestState] = useState("");

  /** Landmark + optional GPS pin for riders (Firestore). */
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryGeoLoading, setDeliveryGeoLoading] = useState(false);

  const [addressDone, setAddressDone] = useState(false);
  const [summaryDone, setSummaryDone] = useState(false);
  const [openStep, setOpenStep] = useState<1 | 2 | 3>(1);

  const [payKey, setPayKey] = useState<string>("upi_gpay");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [savedCards, setSavedCards] = useState(() => readSavedCards());

  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [eta, setEta] = useState<Date | null>(null);
  const [overlay, setOverlay] = useState<"none" | "processing" | "failed">(
    "none"
  );
  const [editAddr, setEditAddr] = useState<SavedAddress | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [placedMethodLabel, setPlacedMethodLabel] = useState("");
  const [paymentTxnId, setPaymentTxnId] = useState("");

  const [orderCount, setOrderCount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDef | null>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [walletPaise, setWalletPaise] = useState(0);
  const [walletSettings, setWalletSettings] = useState(() =>
    getWalletGlobalSettings()
  );
  const [commerceSettingsTick, setCommerceSettingsTick] = useState(0);

  const walletUid = walletUserId(user);
  const hasSaved = addresses.length > 0;

  useEffect(() => {
    function syncWallet() {
      setWalletPaise(getWallet(walletUid).balancePaise);
    }
    syncWallet();
    window.addEventListener("lc-wallet", syncWallet);
    return () => window.removeEventListener("lc-wallet", syncWallet);
  }, [walletUid]);

  useEffect(() => {
    function syncGw() {
      setWalletSettings(getWalletGlobalSettings());
    }
    syncGw();
    window.addEventListener("lc-wallet-settings", syncGw);
    return () => window.removeEventListener("lc-wallet-settings", syncGw);
  }, []);

  useEffect(() => {
    const bump = () => setCommerceSettingsTick((n) => n + 1);
    window.addEventListener("lc-admin-settings", bump);
    window.addEventListener("lc-shipping-rules", bump);
    window.addEventListener("lc-category-discount", bump);
    return () => {
      window.removeEventListener("lc-admin-settings", bump);
      window.removeEventListener("lc-shipping-rules", bump);
      window.removeEventListener("lc-category-discount", bump);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const legacy = localStorage.getItem("lc_demo_order_count");
    const cur = localStorage.getItem(ORDER_COUNT_KEY);
    if (!cur && legacy) {
      localStorage.setItem(ORDER_COUNT_KEY, legacy);
      localStorage.removeItem("lc_demo_order_count");
    }
    setOrderCount(Number(localStorage.getItem(ORDER_COUNT_KEY) ?? "0"));
  }, []);

  /** Fresh address step each visit — no profile/account pre-fill (name, email, phone, lines). */
  useEffect(() => {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestLine1("");
    setGuestPin("");
    setGuestCity("");
    setGuestState("");
    setDeliveryLandmark("");
    setDeliveryLat(null);
    setDeliveryLng(null);
  }, []);

  const requestDeliveryPin = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setDeliveryGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        setDeliveryGeoLoading(false);
      },
      () => setDeliveryGeoLoading(false),
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
  }, []);

  function magicCheckoutFill() {
    if (!user) return;
    const a =
      addresses.find((x) => x.label === "Home") ?? addresses[0];
    if (!a) return;
    setUseGuestForm(true);
    setGuestLine1(a.line1);
    setGuestPin(a.pin);
    setGuestCity(a.city);
    setGuestState(a.state ?? "");
  }

  useEffect(() => {
    clearCheckoutRecovery();
    markCheckoutEntered();
    return () => {
      if (!completedRef.current) markCheckoutLeftWithoutOrder();
    };
  }, []);

  useEffect(() => {
    if (!hasSaved) return;
    if (!addrId || !addresses.some((a) => a.id === addrId)) {
      setAddrId(addresses[0]!.id);
    }
  }, [addresses, addrId, hasSaved]);

  useEffect(() => {
    const r = applyPinLookupIfNew(guestPin, guestPinLookupRef);
    if (r) {
      setGuestCity(r.city);
      setGuestState(r.state);
    }
  }, [guestPin]);

  const lines = useMemo((): { qty: number; product: Product }[] => {
    return items
      .map((i) => {
        const p = getProductById(i.productId);
        return p ? { qty: i.qty, product: p } : null;
      })
      .filter((x): x is { qty: number; product: Product } => x !== null);
  }, [items]);

  const itemTotal = useMemo(() => {
    void commerceSettingsTick;
    return lines.reduce((s, l) => s + effectiveLineTotalRupees(l.product, l.qty), 0);
  }, [lines, commerceSettingsTick]);

  const deliveryCity = useMemo(() => {
    if (useGuestForm) return guestCity.trim();
    const a = addresses.find((x) => x.id === addrId);
    return a?.city?.trim() ?? "";
  }, [useGuestForm, guestCity, addresses, addrId]);

  const deliveryPinDigits = useMemo(() => {
    if (useGuestForm) return guestPin.replace(/\D/g, "").slice(0, 6);
    const a = addresses.find((x) => x.id === addrId);
    return (a?.pin ?? "").replace(/\D/g, "").slice(0, 6);
  }, [useGuestForm, guestPin, addresses, addrId]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.min(
      itemTotal,
      Math.round((itemTotal * appliedCoupon.discountPct) / 100)
    );
  }, [appliedCoupon, itemTotal]);

  const prepaidDiscount =
    payKey === "cod"
      ? 0
      : Math.min(25, Math.round(itemTotal * 0.02));

  const pricing = useMemo(() => {
    void commerceSettingsTick;
    return computeCheckoutPricingBase({
      itemTotalRupees: itemTotal,
      pinDigits: deliveryPinDigits,
      isCod: payKey === "cod",
      couponDiscountRupees: couponDiscount,
      prepaidDiscountRupees: prepaidDiscount,
    });
  }, [
    itemTotal,
    deliveryPinDigits,
    payKey,
    couponDiscount,
    prepaidDiscount,
    commerceSettingsTick,
  ]);

  const delivery =
    pricing.deliveryFee + pricing.codHandling;

  const applicableCoupons = useMemo(
    () => getApplicableCoupons(itemTotal, { orderCount }),
    [itemTotal, orderCount]
  );

  useEffect(() => {
    if (!appliedCoupon) return;
    if (!applicableCoupons.some((c) => c.code === appliedCoupon.code)) {
      setAppliedCoupon(null);
    }
  }, [applicableCoupons, appliedCoupon]);

  const accountHasEmail = Boolean(user?.email?.includes("@"));
  const contactEmailOk =
    accountHasEmail || guestEmail.trim().includes("@");
  const contactPhoneDigits = guestPhone.replace(/\D/g, "").slice(0, 10);
  const contactPhoneOk = contactPhoneDigits.length === 10;
  const fullNameOk = guestName.trim().length >= 3;

  const guestValid =
    contactEmailOk &&
    contactPhoneOk &&
    fullNameOk &&
    guestLine1.trim().length > 3 &&
    guestPin.replace(/\D/g, "").length === 6 &&
    guestCity.trim().length > 0;

  const canPlaceAddress = Boolean(user) &&
    contactEmailOk &&
    contactPhoneOk &&
    fullNameOk &&
    ((!useGuestForm && hasSaved && Boolean(addrId)) ||
      (useGuestForm && guestValid));

  const payableBeforeWallet = Math.max(0, pricing.subtotalBeforeWallet);
  const walletBalanceRupees = Math.floor(walletPaise / 100);
  const walletApplied = useWallet
    ? Math.min(walletBalanceRupees, payableBeforeWallet)
    : 0;
  const walletAppliedPaise = walletApplied * 100;

  const grandTotalRupees = useMemo(
    () => Math.max(0, payableBeforeWallet - walletApplied),
    [payableBeforeWallet, walletApplied]
  );

  const selectedAddr = addresses.find((a) => a.id === addrId);

  const pinComplete = guestPin.replace(/\D/g, "").length === 6;

  /** Full line saved on the order for riders (Firestore `deliveryAddress`, max 500 chars). */
  const addressSummaryLine = useMemo(() => {
    if (useGuestForm && guestName.trim()) {
      const pin6 = guestPin.replace(/\D/g, "").slice(0, 6);
      const street = guestLine1.trim();
      const cityState = [guestCity.trim(), guestState.trim()].filter(Boolean).join(", ");
      const core = [street, cityState, pin6].filter(Boolean).join(", ");
      const contact = `${guestName.trim()} · ${guestPhone.replace(/\D/g, "").slice(0, 10)}`;
      const line = core ? `${core} · ${contact}` : `${guestName.trim()} · ${guestCity} · ${pin6}`;
      return line.slice(0, 500);
    }
    if (selectedAddr) {
      const l2 = selectedAddr.line2?.trim();
      const parts = [
        selectedAddr.line1.trim(),
        l2,
        `${selectedAddr.city.trim()}${selectedAddr.state ? `, ${selectedAddr.state}` : ""} — ${selectedAddr.pin}`,
      ].filter(Boolean);
      return parts.join(", ").slice(0, 500);
    }
    return "";
  }, [
    useGuestForm,
    guestName,
    guestCity,
    guestState,
    guestPin,
    guestLine1,
    guestPhone,
    selectedAddr,
  ]);

  const payLabel = useMemo(() => {
    if (payKey === "cod") return t("paymentCod");
    if (payKey === "netbanking") return t("paymentNet");
    if (payKey.startsWith("upi")) return t("paymentUpi");
    if (payKey.startsWith("card")) return t("paymentCard");
    return t("paymentCard");
  }, [payKey, t]);

  const paymentValid = useCallback(() => {
    if (payKey === "card_new") {
      const digits = cardNumber.replace(/\D/g, "");
      return (
        digits.length >= 16 &&
        cardExpiry.trim().length >= 4 &&
        cardCvv.trim().length >= 3 &&
        cardName.trim().length > 2
      );
    }
    return true;
  }, [payKey, cardNumber, cardExpiry, cardCvv, cardName]);

  function continueFromAddress() {
    if (!canPlaceAddress) return;
    setAddressDone(true);
    setOpenStep(2);
  }

  function continueFromSummary() {
    setSummaryDone(true);
    setOpenStep(3);
  }

  function changeSummary() {
    setSummaryDone(false);
    setOpenStep(2);
  }

  function placeOrder(opts?: { fromRazorpay?: boolean; paymentTxnId?: string }) {
    if (!user?.uid) return;
    if (!canPlaceAddress) return;
    if (!opts?.fromRazorpay && !paymentValid()) return;
    const methodLabel = opts?.fromRazorpay ? t("paymentRazorpay") : payLabel;
    const orderUid = user?.uid;
    const orderWalletUid = walletUid;
    setOverlay("processing");
    window.setTimeout(async () => {
      const id = `LC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken();
        if (!token) {
          setOverlay("none");
          alert("Please sign in again to confirm inventory.");
          return;
        }
        const invRes = await fetch("/api/inventory/commit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: id,
            lines: lines.map((l) => ({
              variantId: l.product.id,
              productId: l.product.id,
              qty: l.qty,
            })),
          }),
        });
        if (!invRes.ok) {
          const j = (await invRes.json().catch(() => ({}))) as { error?: string };
          setOverlay("none");
          alert(j.error ?? "Some items are out of stock. Please update cart.");
          return;
        }
      } catch {
        setOverlay("none");
        alert("Could not verify stock right now. Please try again.");
        return;
      }
      if (walletAppliedPaise > 0) {
        const debited = debitWalletPaise(
          orderWalletUid,
          walletAppliedPaise,
          `${t("walletDebitLabel")} ${id}`,
          { kind: "order", orderId: id }
        );
        if (!debited) {
          setOverlay("none");
          alert(t("walletDebitFailed"));
          return;
        }
      }
      const txn =
        opts?.paymentTxnId?.trim() ||
        `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      setPaymentTxnId(txn);
      setOrderId(id);
      setPlacedMethodLabel(methodLabel);
      const days = 5 + (id.charCodeAt(0) % 3);
      setEta(addCalendarDays(new Date(), days));
      if (payKey === "card_new" && saveCard) {
        const digits = cardNumber.replace(/\D/g, "");
        const last4 = digits.slice(-4);
        const brand =
          digits.startsWith("4") ? "visa" : digits.startsWith("5") ? "mastercard" : "rupay";
        addSavedCard({ brand, last4 });
        setSavedCards(readSavedCards());
      }
      completedRef.current = true;
      try {
        recordUserPayment({
          orderId: id,
          paymentTxnId: txn,
          amountRupees: grandTotalRupees,
          method: methodLabel,
          at: new Date().toISOString(),
          status: "success",
          refundStep: "none",
        });
      } catch {
        /* ignore */
      }
      try {
        const db = getFirebaseDb();
        if (db && orderUid && canUseFirestoreSync(orderUid)) {
          const customerName = guestName.trim() || "Customer";
          const customerPhone = contactPhoneDigits || "";
          const deliveryPinDigits = useGuestForm
            ? guestPin.replace(/\D/g, "").slice(0, 6)
            : (selectedAddr?.pin ?? "").replace(/\D/g, "").slice(0, 6);
          void saveUserOrderToFirestore(db, orderUid, {
            id,
            placedAt: new Date().toISOString(),
            totalRupees: grandTotalRupees,
            methodLabel,
            paymentTxnId: txn,
            itemCount: items.length,
            status: "placed",
            shipmentStep: 0,
            itemTitle:
              lines.length === 1
                ? lines[0]!.product.title
                : lines
                    .slice(0, 2)
                    .map((l) => l.product.title)
                    .join(" · ") +
                  (lines.length > 2 ? ` +${lines.length - 2}` : ""),
            updatedAt: Date.now(),
            customerName,
            customerPhone: customerPhone || undefined,
            deliveryPin: deliveryPinDigits || undefined,
            hubCity: deliveryCity.trim() || undefined,
            deliveryAddress: addressSummaryLine || undefined,
            deliveryLandmark: deliveryLandmark.trim() || undefined,
            ...(deliveryLat != null && deliveryLng != null
              ? { deliveryLat, deliveryLng }
              : {}),
            /** Must use payKey — translated labels (e.g. BN) do not contain "COD". */
            paymentStatus: payKey === "cod" ? "PENDING" : "PAID",
            lineItems: lines
              .map((l) => ({
                variantId: String(l.product.id || "").trim(),
                productId: String(l.product.id || "").trim(),
                qty: Math.max(1, Math.floor(Number(l.qty) || 1)),
              }))
              .filter((l) => l.variantId),
          }).then(() => {
            try {
              setAdminOrderFirebaseUid(id, orderUid);
            } catch {
              /* ignore */
            }
            try {
              window.dispatchEvent(new CustomEvent("lc-user-orders"));
            } catch {
              /* ignore */
            }
          });
        }
      } catch {
        /* ignore */
      }
      try {
        const n = Number(localStorage.getItem(ORDER_COUNT_KEY) ?? "0") + 1;
        localStorage.setItem(ORDER_COUNT_KEY, String(n));
        setOrderCount(n);
      } catch {
        /* ignore */
      }
      try {
        prependOrderPlacedNotification(id, grandTotalRupees, methodLabel);
      } catch {
        /* ignore */
      }
      clearCheckoutRecovery();
      clear();
      setOverlay("none");
      setPlaced(true);
    }, 1200);
  }

  const successPayLabel = placedMethodLabel || payLabel;

  if (placed && orderId) {
    const waText = encodeURIComponent(
      `Hi — Order ${orderId}. Paid via ${successPayLabel}. Please confirm dispatch.`
    );
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="glass rounded-3xl p-8 text-center dark:border-slate-700/80"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <CheckCircle2 className="h-12 w-12" strokeWidth={2} />
          </motion.div>
          <p className="mt-6 text-xl font-bold text-slate-900 dark:text-slate-100">
            {t("orderSuccessTitle")}
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {t("orderPlacedDetail", { method: successPayLabel })}
          </p>
          <p className="mt-4 font-mono text-lg font-semibold text-[#0066ff]">
            {orderId}
          </p>
          {paymentTxnId ? (
            <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                {t("paymentTxnLabel")}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {paymentTxnId}
              </p>
            </div>
          ) : null}
          {eta ? (
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              {t("estimatedDelivery", { date: formatEta(eta) })}
            </p>
          ) : null}
          {whatsappUpdates ? (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
              {t("whatsappUpdatesNote")}
            </p>
          ) : null}
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-sm font-bold text-emerald-700 underline dark:text-emerald-400"
          >
            {t("whatsappOrderLink")}
          </a>
          <Link
            href="/orders"
            className="mt-6 inline-flex w-full justify-center rounded-[12px] bg-gradient-to-br from-[#2f84ff] via-[#2874f0] to-[#1a5fd4] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#2874f0]/25 hover:brightness-105"
          >
            {t("trackOrder")}
          </Link>
          <Link
            href="/account/orders"
            className="mt-3 block text-sm font-medium text-neutral-600 underline hover:text-[#0066ff] dark:text-neutral-400"
          >
            {t("viewOrders")}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">{t("cartEmpty")}</p>
        <Link
          href="/search"
          className="mt-4 inline-block text-[#0066ff] hover:underline"
        >
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

  if (authStatus === "loading") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center md:py-24">
        <Loader2
          className="h-8 w-8 animate-spin text-[#0066ff]"
          aria-hidden
        />
        <span className="sr-only">{t("loadingCheckout")}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
        <div className="glass rounded-3xl border border-amber-200/80 bg-amber-50/90 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
          <Lock className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("loginRequiredTitle")}
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {t("loginRequiredBody")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setShowOtp(true)}
              className="rounded-[12px] bg-gradient-to-br from-[#2f84ff] via-[#2874f0] to-[#1a5fd4] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#2874f0]/25 hover:brightness-105"
            >
              {t("quickOtp")}
            </button>
            <Link
              href="/login?returnUrl=%2Fcheckout"
              className="rounded-[12px] border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("signInHint")}
            </Link>
          </div>
          <Link
            href="/cart"
            className="mt-6 inline-block text-sm font-medium text-[#0066ff] underline"
          >
            {t("backToCart")}
          </Link>
        </div>
        <CheckoutOtpModal open={showOtp} onClose={() => setShowOtp(false)} />
      </div>
    );
  }

  return (
    <>
      <CheckoutProcessingOverlay
        open={overlay === "processing" || overlay === "failed"}
        variant={overlay === "failed" ? "failed" : "processing"}
        onDismiss={() => setOverlay("none")}
        onRetryUpi={() => {
          setPayKey("upi_gpay");
          setOverlay("none");
        }}
        onRetryCard={() => {
          setPayKey("card_new");
          setOverlay("none");
        }}
        onRetryNet={() => {
          setPayKey("netbanking");
          setOverlay("none");
        }}
      />
      <CheckoutAddressEditDialog
        open={Boolean(editAddr)}
        address={editAddr}
        onClose={() => setEditAddr(null)}
        onSave={(id, patch) => update(id, patch)}
      />
      <CheckoutOtpModal open={showOtp} onClose={() => setShowOtp(false)} />

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <CheckoutProgress step={openStep} />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t("singlePageHint")}
        </p>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t("signedInCheckout", {
            email: user.email ?? user.displayName ?? "—",
          })}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Step 1 */}
            <section
              className={cn(
                "overflow-hidden rounded-[18px] border transition dark:border-slate-700/80",
                openStep === 1
                  ? "border-[#0066ff]/30 bg-white shadow-[0_8px_40px_rgba(0,102,255,0.08)] dark:bg-slate-900/40"
                  : "border-neutral-200/90 bg-white/90 dark:bg-slate-900/30"
              )}
            >
              <button
                type="button"
                onClick={() => setOpenStep(1)}
                className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0066ff] text-sm font-bold text-white shadow-md shadow-[#0066ff]/25">
                  {addressDone ? "✓" : "1"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#0066ff]/20">
                        <MapPin className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      {t("deliveryAddress")}
                    </h2>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-neutral-400 transition",
                        openStep === 1 && "rotate-180"
                      )}
                    />
                  </div>
                  {addressDone && openStep !== 1 && addressSummaryLine ? (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {addressSummaryLine}
                    </p>
                  ) : null}
                </div>
              </button>
              {openStep === 1 ? (
                <CheckoutAddressStep
                  hasSaved={hasSaved}
                  useGuestForm={useGuestForm}
                  setUseGuestForm={setUseGuestForm}
                  addresses={addresses}
                  addrId={addrId}
                  setAddrId={setAddrId}
                  setEditAddr={setEditAddr}
                  guestEmail={guestEmail}
                  setGuestEmail={setGuestEmail}
                  guestPhone={guestPhone}
                  setGuestPhone={setGuestPhone}
                  guestName={guestName}
                  setGuestName={setGuestName}
                  guestLine1={guestLine1}
                  setGuestLine1={setGuestLine1}
                  guestPin={guestPin}
                  setGuestPin={setGuestPin}
                  guestCity={guestCity}
                  setGuestCity={setGuestCity}
                  guestState={guestState}
                  setGuestState={setGuestState}
                  pinComplete={pinComplete}
                  canPlaceAddress={canPlaceAddress}
                  onContinue={continueFromAddress}
                  showMagicCheckout={Boolean(user && addresses.length > 0 && useGuestForm)}
                  onMagicCheckout={magicCheckoutFill}
                  accountEmail={user?.email ?? null}
                  deliveryLandmark={deliveryLandmark}
                  setDeliveryLandmark={setDeliveryLandmark}
                  deliveryLat={deliveryLat}
                  deliveryLng={deliveryLng}
                  deliveryGeoLoading={deliveryGeoLoading}
                  onRequestDeliveryPin={requestDeliveryPin}
                />
              ) : null}
            </section>

            {/* Step 2 */}
            <section
              className={cn(
                "overflow-hidden rounded-[18px] border transition dark:border-slate-700/80",
                openStep === 2
                  ? "border-[#0066ff]/30 bg-white shadow-[0_8px_40px_rgba(0,102,255,0.08)] dark:bg-slate-900/40"
                  : "border-neutral-200/90 bg-white/90 dark:bg-slate-900/30"
              )}
            >
              <button
                type="button"
                onClick={() => addressDone && setOpenStep(2)}
                disabled={!addressDone}
                className="flex w-full items-start gap-3 p-4 text-left disabled:opacity-50"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    summaryDone
                      ? "bg-emerald-500 text-white"
                      : openStep === 2
                        ? "bg-[#0066ff] text-white"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  )}
                >
                  {summaryDone ? "✓" : "2"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      {t("orderSummaryTitle")}
                    </h2>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-neutral-400 transition",
                        openStep === 2 && "rotate-180"
                      )}
                    />
                  </div>
                  {summaryDone && openStep !== 2 ? (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {t("itemsCount", { count: lines.length })}
                    </p>
                  ) : null}
                </div>
              </button>
              {openStep === 2 ? (
                <div className="space-y-4 border-t border-neutral-200/80 p-4 dark:border-slate-700">
                  <ul className="space-y-3">
                    {lines.map(({ product, qty }) => (
                      <li
                        key={product.id}
                        className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <Link
                          href={`/product/${product.id}`}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white"
                        >
                          <Image
                            src={product.images[0]!}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {product.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {t("qtyLabel")}: {qty}
                          </p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            ₹
                            {effectiveLineTotalRupees(product, qty).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    {summaryDone ? (
                      <button
                        type="button"
                        onClick={changeSummary}
                        className="text-sm font-medium text-[#0066ff] underline"
                      >
                        {t("changeStep")}
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/[0.04] p-4 dark:border-[#0066ff]/30 dark:bg-[#0066ff]/10">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#0066ff]">
                      {t("couponsTitle")}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {t("couponsHint")}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {applicableCoupons.map((c, i) => {
                        const active = appliedCoupon?.code === c.code;
                        return (
                          <li
                            key={`${c.code}-${i}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800/50"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {c.code}
                              </span>
                              <span className="ml-2 text-slate-600 dark:text-slate-400">
                                {c.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setAppliedCoupon(active ? null : c)
                              }
                              className="rounded-lg bg-[#0066ff] px-3 py-1 text-xs font-bold text-white hover:bg-[#0052cc]"
                            >
                              {active ? t("couponRemove") : t("couponApply")}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <RippleButton
                    type="button"
                    disabled={!addressDone}
                    onClick={continueFromSummary}
                    rippleClassName="bg-white/30"
                    className={cn(
                      "w-full rounded-[12px] py-3 text-sm font-semibold text-white transition",
                      addressDone
                        ? "bg-[#0066ff] hover:bg-[#0052cc]"
                        : "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    {t("continueToPayment")}
                  </RippleButton>
                </div>
              ) : null}
            </section>

            {/* Step 3 */}
            <section
              className={cn(
                "overflow-hidden rounded-[18px] border transition dark:border-slate-700/80",
                openStep === 3
                  ? "border-[#0066ff]/30 bg-white shadow-[0_8px_40px_rgba(0,102,255,0.08)] dark:bg-slate-900/40"
                  : "border-neutral-200/90 bg-white/90 dark:bg-slate-900/30"
              )}
            >
              <button
                type="button"
                onClick={() => summaryDone && setOpenStep(3)}
                disabled={!summaryDone}
                className="flex w-full items-start gap-3 p-4 text-left disabled:opacity-50 sm:p-5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md",
                    openStep === 3
                      ? "bg-[#0066ff] text-white shadow-[#0066ff]/25"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  )}
                >
                  3
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#0066ff]/20">
                        <CreditCard className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      {t("payment")}
                    </h2>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-neutral-400 transition",
                        openStep === 3 && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </button>
              {openStep === 3 ? (
                <CheckoutPaymentStep
                  payKey={payKey}
                  setPayKey={setPayKey}
                  savedCards={savedCards}
                  cardNumber={cardNumber}
                  setCardNumber={setCardNumber}
                  cardExpiry={cardExpiry}
                  setCardExpiry={setCardExpiry}
                  cardCvv={cardCvv}
                  setCardCvv={setCardCvv}
                  cardName={cardName}
                  setCardName={setCardName}
                  saveCard={saveCard}
                  setSaveCard={setSaveCard}
                  whatsappUpdates={whatsappUpdates}
                  setWhatsappUpdates={setWhatsappUpdates}
                  paymentValid={paymentValid}
                  canPlaceAddress={canPlaceAddress}
                  processingLocked={overlay !== "none"}
                  onPay={placeOrder}
                  grandTotalRupees={grandTotalRupees}
                  receiptId={addrId || "guest"}
                  onRazorpayPaid={(paymentId) =>
                    placeOrder({ fromRazorpay: true, paymentTxnId: paymentId })
                  }
                />
              ) : null}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <PriceSummary
                itemTotal={itemTotal}
                delivery={delivery}
                prepaidDiscount={prepaidDiscount}
                couponDiscount={couponDiscount}
                walletApplied={walletApplied}
                gstAmount={pricing.gstAmount}
                gstPercent={pricing.gstPercent}
                deliveryFee={pricing.deliveryFee}
                codHandling={pricing.codHandling}
              />
              {walletSettings.walletPaymentsEnabled && walletBalanceRupees > 0 ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-violet-200/90 bg-violet-50/80 px-3 py-3 text-sm dark:border-violet-900/50 dark:bg-violet-950/30">
                  <input
                    type="checkbox"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0066ff]"
                  />
                  <span className="text-slate-800 dark:text-slate-200">
                    {t("useWalletBalance", {
                      amount: walletBalanceRupees.toLocaleString("en-IN"),
                    })}
                  </span>
                </label>
              ) : null}
              {walletSettings.walletPaymentsEnabled &&
              useWallet &&
              walletApplied > 0 &&
              grandTotalRupees > 0 ? (
                <p className="rounded-lg border border-[#2874f0]/25 bg-[#2874f0]/5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                  {t("partialWalletHint", {
                    w: walletApplied.toLocaleString("en-IN"),
                    rest: grandTotalRupees.toLocaleString("en-IN"),
                  })}
                </p>
              ) : null}
              <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                {t("walletRefundHint")}
              </p>
              {deliveryPinDigits.length === 6 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pricing.matchedRuleLabel
                    ? t("shippingRuleHint", {
                        label: pricing.matchedRuleLabel,
                        fee: pricing.deliveryFee.toLocaleString("en-IN"),
                      })
                    : t("checkoutFeesHint", {
                        city: deliveryCity || "—",
                        delivery: pricing.deliveryFee.toLocaleString("en-IN"),
                        cod:
                          pricing.codHandling > 0
                            ? pricing.codHandling.toLocaleString("en-IN")
                            : "0",
                        gst: pricing.gstAmount.toLocaleString("en-IN"),
                      })}
                </p>
              ) : null}
              <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                <p className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  {t("trustReturn")}
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-600" />
                  {t("trustSecure")}
                </p>
                <p className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-amber-600" />
                  {t("trustOriginal")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
