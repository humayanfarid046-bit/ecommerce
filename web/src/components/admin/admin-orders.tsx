"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import {
  type AdminOrderRow,
  type AdminReturnReq,
  type AdminUserRow,
} from "@/lib/admin-types";
import {
  InvoicePrintButton,
  ShippingLabelButton,
} from "@/components/admin/invoice-print-button";
import {
  setOrderTracking,
  statusToStep,
  dispatchOrderTrackingEvent,
  getOrderTrackingOverride,
} from "@/lib/order-tracking-sync";
import { cn } from "@/lib/utils";
import {
  Search,
  User,
  X,
  Package,
  Bell,
  Link2,
  ChevronDown,
  ChevronUp,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import {
  confirmCodOrder,
  getEffectiveCodConfirmation,
  getDeliveryOtp,
  setDeliveryOtp,
} from "@/lib/cod-order-sync";
import { computeDeliveryQuote } from "@/lib/shipping-rules-storage";
import {
  getAdminOrderFirebaseUid,
  setAdminOrderFirebaseUid,
} from "@/lib/admin-order-firebase-uid";
import type { UserOrderRecord } from "@/lib/user-order-firestore";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureMisleadingDemoAllowed } from "@/lib/deploy-safety";
import { getTaxPercent } from "@/lib/admin-security-storage";
import { getDeliveryOpsPolicy } from "@/lib/admin-security-storage";
import {
  buildBulkInvoiceHtmlDocument,
  getInvoiceHsn,
  linesFromInclusiveTotal,
  openPrintableHtml,
} from "@/lib/invoice-document";

const STATUS_FILTERS = ["all", "pending", "shipped", "delivered", "cancelled"] as const;

function mapAdminStatusToFirestore(
  status: AdminOrderRow["status"]
): UserOrderRecord["status"] {
  switch (status) {
    case "pending":
      return "processing";
    case "shipped":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
  }
}
const PAY_FILTERS = ["all", "UPI", "COD", "Card", "NetBanking"] as const;

function rowTone(s: AdminOrderRow["status"]) {
  switch (s) {
    case "pending":
      return "bg-amber-50/90 dark:bg-amber-950/25";
    case "shipped":
      return "bg-sky-50/90 dark:bg-sky-950/25";
    case "delivered":
      return "bg-emerald-50/90 dark:bg-emerald-950/25";
    case "cancelled":
      return "bg-rose-50/90 dark:bg-rose-950/25";
    default:
      return "";
  }
}

export function AdminOrders() {
  const { user, status: authStatus } = useAuth();
  const getAuthHeader = useCallback(async () => {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const t = useTranslations("admin");
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const [userIndex, setUserIndex] = useState<AdminUserRow[]>([]);
  const [returns, setReturns] = useState<AdminReturnReq[]>([]);

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [statusF, setStatusF] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [payF, setPayF] = useState<(typeof PAY_FILTERS)[number]>("all");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customerModal, setCustomerModal] = useState<string | null>(null);

  const [trackDraft, setTrackDraft] = useState({
    trackingId: "",
    timelineNote: "",
    courier: "other" as "delhivery" | "ecom_express" | "other",
  });
  const [codTick, setCodTick] = useState(0);
  const [deliveryOtpDraft, setDeliveryOtpDraft] = useState("");
  const [firebaseUidDraft, setFirebaseUidDraft] = useState("");
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [deliveryActionBusy, setDeliveryActionBusy] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState<
    Array<{ uid: string; name: string; phone: string; email: string; disabled?: boolean }>
  >([]);
  const [newRider, setNewRider] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [riderPerf, setRiderPerf] = useState<
    Array<{ partnerId: string; partnerName: string; cashCollected: number; deliveredCount: number }>
  >([]);
  const [riderCreateBusy, setRiderCreateBusy] = useState(false);

  const ordersFirstLoadRef = useRef(true);
  const ordersSeenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    ordersFirstLoadRef.current = true;
    ordersSeenIdsRef.current = new Set();
  }, [user?.uid]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const loadOrdersData = useCallback(async () => {
    if (authStatus !== "ready") return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const headers = await getAuthHeader();
      const [resO, resU] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);
      const resP = await fetch("/api/admin/delivery-partners", { headers });
      const resR = await fetch("/api/admin/returns", { headers });
      const jO = (await resO.json().catch(() => ({}))) as {
        orders?: AdminOrderRow[];
        riderPerformance?: Array<{
          partnerId: string;
          partnerName: string;
          cashCollected: number;
          deliveredCount: number;
        }>;
      };
      const jU = (await resU.json().catch(() => ({}))) as {
        users?: AdminUserRow[];
      };
      const jR = (await resR.json().catch(() => ({}))) as {
        returns?: AdminReturnReq[];
      };
      const jP = (await resP.json().catch(() => ({}))) as {
        partners?: Array<{
          uid: string;
          name: string;
          phone: string;
          email: string;
          disabled?: boolean;
        }>;
      };
      if (resO.ok && Array.isArray(jO.orders)) {
        const incoming = jO.orders;
        if (!ordersFirstLoadRef.current) {
          const seen = ordersSeenIdsRef.current;
          const newcomers = incoming.filter((o) => !seen.has(o.id));
          if (newcomers.length > 0) {
            setToast(t("newOrderToast", { id: newcomers[0]!.id }));
          }
        }
        ordersFirstLoadRef.current = false;
        ordersSeenIdsRef.current = new Set(incoming.map((o) => o.id));
        setOrders(incoming);
        setRiderPerf(Array.isArray(jO.riderPerformance) ? jO.riderPerformance : []);
        for (const o of incoming) {
          try {
            setAdminOrderFirebaseUid(o.id, o.customerId);
          } catch {
            /* ignore */
          }
        }
        setOrdersError(null);
      } else {
        setOrders([]);
        setOrdersError(t("ordersLoadFailed"));
      }
      if (resU.ok && Array.isArray(jU.users)) {
        setUserIndex(jU.users);
        setUsersLoadError(null);
      } else {
        setUserIndex([]);
        setUsersLoadError(t("usersDirectoryUnavailable"));
      }
      if (resR.ok && Array.isArray(jR.returns)) {
        setReturns(jR.returns);
      }
      if (resP.ok && Array.isArray(jP.partners)) {
        setDeliveryPartners(jP.partners);
      } else {
        setDeliveryPartners([]);
      }
    } catch {
      setOrders([]);
      setOrdersError(t("ordersLoadFailed"));
    } finally {
      setOrdersLoading(false);
    }
  }, [authStatus, getAuthHeader, t]);

  useEffect(() => {
    void loadOrdersData();
  }, [loadOrdersData, user?.uid]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadOrdersData();
    }, 45_000);
    return () => window.clearInterval(tick);
  }, [loadOrdersData]);

  useEffect(() => {
    if (!expanded) return;
    const cur = getAdminOrderFirebaseUid(expanded);
    setFirebaseUidDraft(cur);
    if (cur) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/order/lookup?orderId=${encodeURIComponent(expanded)}`,
          { headers: await getAuthHeader() }
        );
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { userId?: string | null };
        if (j.userId && !cancelled) {
          setAdminOrderFirebaseUid(expanded, j.userId);
          setFirebaseUidDraft(j.userId);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, getAuthHeader]);

  useEffect(() => {
    const fn = () => setCodTick((x) => x + 1);
    window.addEventListener("lc-cod-order-meta", fn);
    return () => window.removeEventListener("lc-cod-order-meta", fn);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const ov = getOrderTrackingOverride(expanded);
    setTrackDraft({
      trackingId: ov?.trackingId ?? "",
      timelineNote: ov?.timelineNote ?? "",
      courier: ov?.courier ?? "other",
    });
  }, [expanded]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusF !== "all" && o.status !== statusF) return false;
      if (payF !== "all" && o.paymentMethod !== payF) return false;
      const min = minAmt ? Number(minAmt) : NaN;
      const max = maxAmt ? Number(maxAmt) : NaN;
      if (Number.isFinite(min) && o.amount < min) return false;
      if (Number.isFinite(max) && o.amount > max) return false;
      if (dateFrom && o.placedDate < dateFrom) return false;
      if (dateTo && o.placedDate > dateTo) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const hit =
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.customerId.toLowerCase().includes(q) ||
          o.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""));
        if (!hit) return false;
      }
      return true;
    });
  }, [orders, statusF, payF, minAmt, maxAmt, dateFrom, dateTo, search]);

  const tableBusy = authStatus !== "ready" || ordersLoading;

  const visibleIds = filtered.map((o) => o.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleIds));
    }
  };

  const setStatus = useCallback(
    async (id: string, nextStatus: AdminOrderRow["status"]) => {
      const row = ordersRef.current.find((o) => o.id === id);
      if (!row?.customerId) {
        setToast(t("orderStatusNoUser"));
        return;
      }
      try {
        let deliveryOtpAttempt: string | undefined;
        let skipOtpVerification: boolean | undefined;
        if (nextStatus === "delivered" && row.deliveryOtp) {
          const useOtp = window.confirm(
            "OK = enter delivery OTP. Cancel = use master bypass (emergency only)."
          );
          if (useOtp) {
            const entered = window.prompt(
              "Enter customer delivery OTP before marking delivered",
              ""
            );
            if (entered == null) return;
            deliveryOtpAttempt = entered.replace(/\D/g, "").slice(0, 6);
          } else {
            if (!window.confirm("Mark delivered without OTP? (Master bypass)")) return;
            skipOtpVerification = true;
          }
        }
        const res = await fetch("/api/admin/order", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({
            userId: row.customerId,
            orderId: id,
            shipmentStep: statusToStep(nextStatus),
            status: mapAdminStatusToFirestore(nextStatus),
            deliveryOtpAttempt,
            skipOtpVerification,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? t("orderStatusSaveFailed"));
          return;
        }
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
        );
        setOrderTracking(id, { step: statusToStep(nextStatus) });
        dispatchOrderTrackingEvent();
        setToast(t("orderStatusSaved"));
      } catch {
        setToast(t("orderStatusSaveFailed"));
      }
    },
    [getAuthHeader, t]
  );

  const setPrivateNote = (id: string, note: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, privateNote: note } : o))
    );
  };

  const saveTracking = async (o: AdminOrderRow) => {
    setOrderTracking(o.id, {
      step: statusToStep(o.status),
      trackingId: trackDraft.trackingId,
      timelineNote: trackDraft.timelineNote,
      courier: trackDraft.courier,
    });
    dispatchOrderTrackingEvent();
    setAdminOrderFirebaseUid(o.id, firebaseUidDraft);
    const uid = getAdminOrderFirebaseUid(o.id);
    if (!uid) {
      setToast(t("trackingSavedLocalOnly"));
      return;
    }
    setTrackingBusy(true);
    try {
      const res = await fetch("/api/admin/order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({
          userId: uid,
          orderId: o.id,
          shipmentStep: statusToStep(o.status),
          status: mapAdminStatusToFirestore(o.status),
          trackingId: trackDraft.trackingId.trim() || undefined,
          timelineNote: trackDraft.timelineNote.trim() || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setToast(j.error ?? t("trackingSaveFailed"));
        return;
      }
      setToast(t("trackingSavedFirestore"));
    } catch {
      setToast(t("trackingSaveFailed"));
    } finally {
      setTrackingBusy(false);
    }
  };

  const assignRider = useCallback(
    async (o: AdminOrderRow) => {
      if (!o.customerId) return;
      const riderName = window.prompt("Rider name", o.riderName ?? "");
      if (riderName == null) return;
      const riderPhone = window.prompt("Rider phone", o.riderPhone ?? "");
      if (riderPhone == null) return;
      const etaSlot =
        window.prompt("Delivery slot (e.g. 4:00 PM - 6:00 PM)", trackDraft.timelineNote || "") ??
        "";
      const token =
        o.riderToken ??
        `${o.id.slice(-6)}-${Math.random().toString(36).slice(2, 10)}`.toLowerCase();
      const expiryHours = getDeliveryOpsPolicy().riderTokenExpiryHours;
      const tokenExpiresAt = Date.now() + expiryHours * 60 * 60 * 1000;
      setDeliveryActionBusy(true);
      try {
        const res = await fetch("/api/admin/order", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({
            userId: o.customerId,
            orderId: o.id,
            riderName: riderName.trim(),
            riderPhone: riderPhone.trim(),
            riderToken: token,
            riderTokenExpiresAt: tokenExpiresAt,
            status: "out_for_delivery",
            shipmentStep: 2,
            eta: etaSlot.trim() || undefined,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? "Failed to assign rider");
          return;
        }
        setOrders((prev) =>
          prev.map((x) =>
            x.id === o.id
              ? {
                  ...x,
                  status: "shipped",
                  riderName: riderName.trim(),
                  riderPhone: riderPhone.trim(),
                  riderToken: token,
                  riderTokenExpiresAt: tokenExpiresAt,
                  riderTokenRevokedAt: undefined,
                  privateNote: etaSlot.trim() ? `ETA: ${etaSlot.trim()}` : x.privateNote,
                }
              : x
          )
        );
        const base = window.location.origin;
        const link = `${base}/delivery/${token}`;
        try {
          await navigator.clipboard.writeText(link);
          setToast(`Rider assigned. Link copied: ${link}`);
        } catch {
          setToast(`Rider assigned. Link: ${link}`);
        }
      } catch {
        setToast("Failed to assign rider");
      } finally {
        setDeliveryActionBusy(false);
      }
    },
    [getAuthHeader, trackDraft.timelineNote]
  );

  const markUndelivered = useCallback(
    async (o: AdminOrderRow) => {
      if (!o.customerId) return;
      const reason = window.prompt("Undelivered reason", "Customer not reachable");
      if (reason == null) return;
      setDeliveryActionBusy(true);
      try {
        const res = await fetch("/api/admin/order", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({
            userId: o.customerId,
            orderId: o.id,
            action: "mark_undelivered",
            undeliveredReason: reason,
            lineItems: o.lineItems ?? [],
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? "Failed to mark undelivered");
          return;
        }
        setOrders((prev) =>
          prev.map((x) => (x.id === o.id ? { ...x, status: "cancelled" } : x))
        );
        setToast("Marked undelivered and restock triggered.");
      } catch {
        setToast("Failed to mark undelivered");
      } finally {
        setDeliveryActionBusy(false);
      }
    },
    [getAuthHeader]
  );

  const revokeRiderToken = useCallback(
    async (o: AdminOrderRow) => {
      if (!o.customerId) return;
      setDeliveryActionBusy(true);
      try {
        const res = await fetch("/api/admin/order", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({
            userId: o.customerId,
            orderId: o.id,
            action: "revoke_rider_token",
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? "Failed to revoke rider link");
          return;
        }
        setOrders((prev) =>
          prev.map((x) =>
            x.id === o.id ? { ...x, riderTokenRevokedAt: Date.now() } : x
          )
        );
        setToast("Rider link revoked.");
      } catch {
        setToast("Failed to revoke rider link");
      } finally {
        setDeliveryActionBusy(false);
      }
    },
    [getAuthHeader]
  );

  const fetchCourierDemo = () => {
    if (!ensureMisleadingDemoAllowed()) {
      setToast("This action is disabled in production for safety.");
      return;
    }
    setToast(t("courierFetchDemo"));
  };

  const notifyDemo = () => {
    if (!ensureMisleadingDemoAllowed()) {
      setToast("This action is disabled in production for safety.");
      return;
    }
    setToast(t("notifyWhatsAppDemo"));
  };

  const bulkShipped = () => {
    if (!ensureMisleadingDemoAllowed()) {
      setToast("This bulk demo action is disabled in production.");
      return;
    }
    const n = selected.size;
    setOrders((prev) =>
      prev.map((o) =>
        selected.has(o.id) ? { ...o, status: "shipped" as const } : o
      )
    );
    selected.forEach((id) => {
      setOrderTracking(id, { step: 1, timelineNote: "Bulk: marked shipped" });
    });
    dispatchOrderTrackingEvent();
    setSelected(new Set());
    setToast(t("bulkShippedDemo", { n }));
  };

  const bulkInvoices = () => {
    if (!ensureMisleadingDemoAllowed()) {
      setToast("This bulk demo action is disabled in production.");
      return;
    }
    const list = orders.filter((o) => selected.has(o.id));
    if (!list.length) return;
    const gstPct = getTaxPercent();
    const hsn = getInvoiceHsn();
    const inputs = list.map((o) => ({
      invoiceNo: o.id,
      invoiceDate: o.placedAt,
      placeOfSupply: "West Bengal",
      buyerName: o.customer,
      buyerPhone: o.phone,
      lines: linesFromInclusiveTotal(
        `Merchandise & fulfilment — order ${o.id}`,
        1,
        o.amount,
        gstPct,
        hsn
      ),
      grandTotal: o.amount,
      gstPercent: gstPct,
      paymentMethod: o.paymentMethod,
      showCodQr: o.paymentMethod === "COD",
      qrAmount: o.amount,
    }));
    openPrintableHtml(buildBulkInvoiceHtmlDocument(inputs));
    setToast(t("bulkInvoiceDemo", { n: list.length }));
  };

  const setReturnStatus = async (
    id: string,
    status: AdminReturnReq["status"],
    refund?: "wallet" | "bank"
  ) => {
    const row = returns.find((r) => r.id === id);
    const uid = row?.userId?.trim();
    if (!row || !uid) {
      setToast(t("returnMissingUserId"));
      return;
    }
    const before = returns;
    const nextRefund = refund ?? row.refundMethod;
    setReturns((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, refundMethod: nextRefund } : r
      )
    );
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({
          userId: uid,
          returnId: row.id,
          orderId: row.orderId,
          status,
          refundMethod: nextRefund ?? null,
          pickupDate: row.pickupDate ?? "",
          adminNote: row.adminNote ?? "",
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setReturns(before);
        setToast(j.error ?? t("returnUpdateFailed"));
        return;
      }
      setReturns((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, processedAt: new Date().toISOString() }
            : r
        )
      );
    } catch {
      setReturns(before);
      setToast(t("returnUpdateFailed"));
    }
  };

  const customerOrders = (cid: string) => orders.filter((o) => o.customerId === cid);

  const assignDeliveryPartner = useCallback(
    async (o: AdminOrderRow, partnerId: string) => {
      const p = deliveryPartners.find((x) => x.uid === partnerId);
      if (!o.customerId || !p) return;
      try {
        const res = await fetch("/api/admin/order", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({
            userId: o.customerId,
            orderId: o.id,
            deliveryPartnerId: p.uid,
            deliveryPartnerName: p.name,
            status: "processing",
            shipmentStep: 1,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? "Failed to assign delivery partner");
          return;
        }
        setOrders((prev) =>
          prev.map((x) =>
            x.id === o.id
              ? { ...x, deliveryPartnerId: p.uid, deliveryPartnerName: p.name }
              : x
          )
        );
        setToast("Delivery partner assigned.");
      } catch {
        setToast("Failed to assign delivery partner");
      }
    },
    [deliveryPartners, getAuthHeader]
  );

  const createDeliveryPartner = useCallback(async () => {
    const email = newRider.email.trim().toLowerCase();
    const password = newRider.password.trim();
    if (!email || password.length < 8) {
      setToast("Email and password (minimum 8 characters) are required — Firebase rejects shorter passwords.");
      return;
    }
    setRiderCreateBusy(true);
    try {
      const res = await fetch("/api/admin/delivery-partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ ...newRider, email, password }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setToast(j.error ?? "Failed to create delivery partner");
        return;
      }
      setNewRider({ name: "", phone: "", email: "", password: "" });
      setToast("Delivery partner created.");
      void loadOrdersData();
    } catch {
      setToast("Failed to create delivery partner");
    } finally {
      setRiderCreateBusy(false);
    }
  }, [getAuthHeader, loadOrdersData, newRider]);

  const patchDeliveryPartner = useCallback(
    async (uid: string, action: "block" | "unblock" | "delete") => {
      try {
        const res = await fetch("/api/admin/delivery-partners", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({ uid, action }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? "Partner update failed");
          return;
        }
        setToast(action === "delete" ? "Partner deleted." : "Partner updated.");
        void loadOrdersData();
      } catch {
        setToast("Partner update failed");
      }
    },
    [getAuthHeader, loadOrdersData]
  );

  const stockInRto = useCallback(
    async (o: AdminOrderRow) => {
      if (!o.customerId) return;
      setDeliveryActionBusy(true);
      try {
        const res = await fetch("/api/admin/order", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeader()),
          },
          body: JSON.stringify({
            userId: o.customerId,
            orderId: o.id,
            action: "stock_in_rto",
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setToast(j.error ?? "Stock-in failed");
          return;
        }
        setOrders((prev) =>
          prev.map((x) => (x.id === o.id ? { ...x, rtoPendingStockIn: false } : x))
        );
        setToast("Inventory restocked from RTO.");
      } catch {
        setToast("Stock-in failed");
      } finally {
        setDeliveryActionBusy(false);
      }
    },
    [getAuthHeader]
  );

  return (
    <div className="relative space-y-8">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {t("ordersTitle")}
          </h2>
          <p className="text-sm text-slate-500">{t("ordersSubtitle")}</p>
        </div>
        <button
          type="button"
          disabled={tableBusy}
          onClick={() => void loadOrdersData()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw
            className={cn("h-4 w-4", tableBusy && "animate-spin")}
          />
          {t("ordersRefresh")}
        </button>
      </div>

      {ordersError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          {ordersError}
        </div>
      ) : null}

      {usersLoadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
          {usersLoadError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-extrabold">
          Invite delivery partner (orders or users access)
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Email + password (min 8 characters). Phone is saved on profile only (not required for login).
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            value={newRider.name}
            onChange={(e) => setNewRider((x) => ({ ...x, name: e.target.value }))}
            placeholder="Name"
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            value={newRider.phone}
            onChange={(e) => setNewRider((x) => ({ ...x, phone: e.target.value }))}
            placeholder="Phone"
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            value={newRider.email}
            onChange={(e) => setNewRider((x) => ({ ...x, email: e.target.value }))}
            placeholder="Email"
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            type="password"
            value={newRider.password}
            onChange={(e) => setNewRider((x) => ({ ...x, password: e.target.value }))}
            placeholder="Password (min 8 chars)"
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </div>
        <button
          type="button"
          disabled={riderCreateBusy || tableBusy}
          onClick={() => void createDeliveryPartner()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {riderCreateBusy ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {riderCreateBusy ? "Creating…" : "Create delivery partner"}
        </button>
        {deliveryPartners.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-slate-500">Active accounts</p>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
              {deliveryPartners.map((p) => (
                <li
                  key={p.uid}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <span className={p.disabled ? "text-slate-400 line-through" : ""}>
                    {p.name} <span className="font-mono text-[10px]">{p.uid.slice(0, 8)}…</span>
                    {p.disabled ? " (blocked)" : ""}
                  </span>
                  <span className="flex gap-1">
                    {p.disabled ? (
                      <button
                        type="button"
                        onClick={() => void patchDeliveryPartner(p.uid, "unblock")}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void patchDeliveryPartner(p.uid, "block")}
                        className="rounded bg-slate-600 px-2 py-0.5 text-[10px] font-bold text-white"
                      >
                        Block
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this delivery partner permanently?")) {
                          void patchDeliveryPartner(p.uid, "delete");
                        }
                      }}
                      className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase text-slate-500">{t("orderFiltersAdvanced")}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("orderSearchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </div>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value as typeof statusF)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? t("filterAll") : t(`status_${s}`)}
              </option>
            ))}
          </select>
          <select
            value={payF}
            onChange={(e) => setPayF(e.target.value as typeof payF)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            {PAY_FILTERS.map((p) => (
              <option key={p} value={p}>
                {p === "all" ? t("payMethodAll") : p}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder={t("orderAmtMin")}
            value={minAmt}
            onChange={(e) => setMinAmt(e.target.value)}
            className="w-28 rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            type="number"
            placeholder={t("orderAmtMax")}
            value={maxAmt}
            onChange={(e) => setMaxAmt(e.target.value)}
            className="w-28 rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#0066ff]/30 bg-[#0066ff]/10 px-4 py-3">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t("bulkSelected", { n: selected.size })}
          </span>
          <button
            type="button"
            onClick={bulkShipped}
            className="rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-extrabold text-white"
          >
            {t("bulkMarkShipped")}
          </button>
          <button
            type="button"
            onClick={bulkInvoices}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
          >
            {t("bulkPrintInvoices")}
          </button>
        </div>
      ) : null}

      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="p-3 font-bold">{t("colOrderId")}</th>
              <th className="p-3 font-bold">{t("colCustomer")}</th>
              <th className="p-3 font-bold">{t("orderColPhone")}</th>
              <th className="p-3 font-bold">{t("colAmount")}</th>
              <th className="p-3 font-bold">{t("orderColPay")}</th>
              <th className="p-3 font-bold">{t("colPin")}</th>
              <th className="p-3 font-bold">Rider</th>
              <th className="p-3 font-bold">{t("colCodPanel")}</th>
              <th className="p-3 font-bold">{t("colStatus")}</th>
              <th className="p-3 font-bold">{t("colPlaced")}</th>
              <th className="p-3 font-bold">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {tableBusy ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr
                  key={`sk-${i}`}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td colSpan={12} className="p-3">
                    <div className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                </tr>
              ))
            ) : ordersError ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-sm text-slate-500">
                  {t("ordersLoadFailed")}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-sm text-slate-500">
                  {t("ordersEmpty")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-sm text-slate-500">
                  {t("ordersNoMatch")}
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
              void codTick; // re-read COD meta from localStorage
              const pin = o.deliveryPin ?? "—";
              const u = userIndex.find((x) => x.id === o.customerId);
              const refusals = u?.codRefusedCount ?? 0;
              const codConf =
                o.paymentMethod === "COD" && o.codConfirmationSeed
                  ? getEffectiveCodConfirmation(o.id, o.codConfirmationSeed)
                  : undefined;
              return (
              <Fragment key={o.id}>
                <tr
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800",
                    rowTone(o.status)
                  )}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{o.id}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setCustomerModal(o.customerId)}
                      className="font-semibold text-[#0066ff] underline-offset-2 hover:underline"
                    >
                      {o.customer}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerModal(o.customerId)}
                      className="ml-2 text-xs text-slate-500 hover:text-[#0066ff]"
                    >
                      {o.phone}
                    </button>
                  </td>
                  <td className="p-3 text-xs text-slate-600">{o.phone}</td>
                  <td className="p-3 tabular-nums">₹{o.amount.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-xs">{o.paymentMethod}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{pin}</td>
                  <td className="p-3 text-xs">
                    <select
                      value={o.deliveryPartnerId ?? ""}
                      onChange={(e) => {
                        const pid = e.target.value;
                        if (pid) void assignDeliveryPartner(o, pid);
                      }}
                      className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-950"
                    >
                      <option value="">Assign Rider</option>
                      {deliveryPartners
                        .filter((p) => !p.disabled)
                        .map((p) => (
                        <option key={p.uid} value={p.uid}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-[11px]">
                    {o.paymentMethod === "COD" ? (
                      <div className="space-y-1">
                        <p className="text-amber-800 dark:text-amber-200">
                          {t("codRefusedScore", { n: refusals })}
                        </p>
                        {codConf ? (
                          <span
                            className={cn(
                              "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold",
                              codConf === "awaiting"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40"
                            )}
                          >
                            {codConf === "awaiting"
                              ? t("codAwaitingIvr")
                              : t("codProcessed")}
                          </span>
                        ) : null}
                        {codConf === "awaiting" ? (
                          <button
                            type="button"
                            onClick={() => {
                              confirmCodOrder(o.id);
                              setCodTick((x) => x + 1);
                            }}
                            className="mt-1 w-full rounded-lg bg-[#0066ff] px-2 py-1 text-[10px] font-bold text-white"
                          >
                            {t("confirmOrderCod")}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          void setStatus(
                            o.id,
                            e.target.value as AdminOrderRow["status"]
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-600 dark:bg-slate-950"
                      >
                        <option value="pending">{t("status_pending")}</option>
                        <option value="shipped">{t("status_shipped")}</option>
                        <option value="delivered">{t("status_delivered")}</option>
                        <option value="cancelled">{t("status_cancelled")}</option>
                      </select>
                      {o.rtoPendingStockIn ? (
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          RTO — restock pending
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{o.placedAt}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <InvoicePrintButton
                        orderId={o.id}
                        customer={o.customer}
                        amount={o.amount}
                        paymentMethod={o.paymentMethod}
                        showCodQr={o.paymentMethod === "COD"}
                        placedAt={o.placedAt}
                        phone={o.phone}
                      />
                      <ShippingLabelButton
                        orderId={o.id}
                        customer={o.customer}
                        phone={o.phone}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((x) => (x === o.id ? null : o.id))
                        }
                        className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold dark:border-slate-600"
                      >
                        <Package className="h-3 w-3" />
                        {expanded === o.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === o.id ? (
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <td colSpan={12} className="p-4">
                      <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-600 dark:bg-slate-950/40">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          {t("shippingQuotePreview")}
                        </p>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                          {(() => {
                            const q = computeDeliveryQuote(
                              o.amount,
                              (o.deliveryPin ?? "700001").replace(/\D/g, ""),
                              o.paymentMethod === "COD"
                            );
                            return (
                              <>
                                {t("previewDelivery")}: ₹
                                {q.deliveryFee.toLocaleString("en-IN")} ·{" "}
                                {t("previewCodFee")}: ₹
                                {q.codHandling.toLocaleString("en-IN")} ·{" "}
                                {q.freeShippingApplied
                                  ? t("previewFreeShip")
                                  : t("previewPaidShip")}
                                {q.matchedRuleLabel ? ` · ${q.matchedRuleLabel}` : ""}
                              </>
                            );
                          })()}
                        </p>
                      </div>
                      {o.rtoPendingStockIn ? (
                        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                          <p className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                            RTO pending — rider returned; restock inventory when goods arrive.
                          </p>
                          <button
                            type="button"
                            disabled={deliveryActionBusy}
                            onClick={() => void stockInRto(o)}
                            className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Stock In (restore inventory)
                          </button>
                        </div>
                      ) : null}
                      {o.paymentMethod === "COD" ? (
                        <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-900/40 dark:bg-violet-950/40">
                          <p className="flex items-center gap-2 text-xs font-bold text-violet-900 dark:text-violet-200">
                            <KeyRound className="h-4 w-4" />
                            {t("deliveryOtpTitle")}
                          </p>
                          <p className="mt-1 text-sm text-violet-800/90 dark:text-violet-300/90">
                            {t("deliveryOtpHint")}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-slate-100">
                              {getDeliveryOtp(o.id) ?? "— — — — — —"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const otp = String(Math.floor(100000 + Math.random() * 900000));
                                setDeliveryOtp(o.id, otp);
                                setCodTick((x) => x + 1);
                              }}
                              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-bold dark:border-violet-700 dark:bg-slate-900"
                            >
                              {t("demoOtpGenerate")}
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <input
                              value={deliveryOtpDraft}
                              onChange={(e) => setDeliveryOtpDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder={t("deliveryOtpPlaceholder")}
                              className="w-40 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (deliveryOtpDraft.length === 6) {
                                  setDeliveryOtp(o.id, deliveryOtpDraft);
                                  setDeliveryOtpDraft("");
                                  setCodTick((x) => x + 1);
                                }
                              }}
                              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white"
                            >
                              {t("deliveryOtpSave")}
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold text-slate-500">
                            {t("privateNote")}
                          </p>
                          <textarea
                            value={o.privateNote ?? ""}
                            onChange={(e) => setPrivateNote(o.id, e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                            placeholder={t("privateNotePlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500">
                            {t("trackingPanelTitle")}
                          </p>
                          <label className="block text-xs font-bold text-slate-500">
                            {t("firebaseUidLabel")}
                            <input
                              value={firebaseUidDraft}
                              onChange={(e) => setFirebaseUidDraft(e.target.value)}
                              onBlur={() =>
                                expanded &&
                                setAdminOrderFirebaseUid(expanded, firebaseUidDraft)
                              }
                              placeholder={t("firebaseUidPlaceholder")}
                              autoComplete="off"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
                            />
                          </label>
                          <p className="text-[10px] leading-snug text-slate-400">
                            {t("firebaseUidHint")}
                          </p>
                          <input
                            value={trackDraft.trackingId}
                            onChange={(e) =>
                              setTrackDraft((d) => ({
                                ...d,
                                trackingId: e.target.value,
                              }))
                            }
                            placeholder={t("trackingIdPlaceholder")}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                          />
                          <textarea
                            value={trackDraft.timelineNote}
                            onChange={(e) =>
                              setTrackDraft((d) => ({
                                ...d,
                                timelineNote: e.target.value,
                              }))
                            }
                            placeholder={t("timelineNotePlaceholder")}
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                          />
                          <select
                            value={trackDraft.courier}
                            onChange={(e) =>
                              setTrackDraft((d) => ({
                                ...d,
                                courier: e.target.value as typeof trackDraft.courier,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                          >
                            <option value="delhivery">Delhivery API</option>
                            <option value="ecom_express">Ecom Express API</option>
                            <option value="other">{t("courierOther")}</option>
                          </select>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={trackingBusy}
                              onClick={() => void saveTracking(o)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                            >
                              {trackingBusy ? "…" : t("saveTrackingUser")}
                            </button>
                            <button
                              type="button"
                              onClick={fetchCourierDemo}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-600"
                            >
                              <Link2 className="h-3 w-3" />
                              {t("courierFetch")}
                            </button>
                            <button
                              type="button"
                              onClick={notifyDemo}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                            >
                              <Bell className="h-3 w-3" />
                              {t("notifySmsWa")}
                            </button>
                            <button
                              type="button"
                              disabled={deliveryActionBusy}
                              onClick={() => void assignRider(o)}
                              className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100"
                            >
                              Assign Rider + Copy Link
                            </button>
                            <button
                              type="button"
                              disabled={deliveryActionBusy}
                              onClick={() => void markUndelivered(o)}
                              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-900 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                            >
                              Undelivered → Restock
                            </button>
                            <button
                              type="button"
                              disabled={deliveryActionBusy || !o.riderToken}
                              onClick={() => void revokeRiderToken(o)}
                              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            >
                              Revoke Rider Link
                            </button>
                          </div>
                          {(o.riderName || o.riderPhone || o.riderToken) && (
                            <div className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700">
                              <p>
                                Rider: {o.riderName || "—"} {o.riderPhone ? `(${o.riderPhone})` : ""}
                              </p>
                              {o.riderToken ? (
                                <p className="font-mono">
                                  Link: {`/delivery/${o.riderToken}`}
                                </p>
                              ) : null}
                              <p>
                                Token:
                                {o.riderTokenRevokedAt
                                  ? " Revoked"
                                  : o.riderTokenExpiresAt && o.riderTokenExpiresAt > 0
                                    ? ` Expires ${new Date(o.riderTokenExpiresAt).toLocaleString("en-IN")}`
                                    : " No expiry"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
              })
            )}
          </tbody>
        </table>
      </div>

      {customerModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <User className="h-5 w-5" />
                {t("customerProfile")}
              </h3>
              <button
                type="button"
                onClick={() => setCustomerModal(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {(() => {
              const u = userIndex.find((x) => x.id === customerModal);
              const oc = customerOrders(customerModal);
              const hint = orders.find((o) => o.customerId === customerModal);
              if (!u) {
                if (!hint) {
                  return (
                    <p className="text-sm text-slate-500">{t("userNotFound")}</p>
                  );
                }
                return (
                  <div className="mt-4 space-y-3 text-sm">
                    {usersLoadError ? (
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        {usersLoadError}
                      </p>
                    ) : null}
                    <p>
                      <strong>{hint.customer}</strong>
                    </p>
                    <p className="text-xs text-slate-500">{hint.phone}</p>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {t("customerOrderHistory")}
                    </p>
                    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-600">
                      {oc.map((x) => (
                        <li key={x.id} className="flex justify-between gap-2">
                          <span className="font-mono">{x.id}</span>
                          <span>₹{x.amount}</span>
                          <span className="text-slate-400">{x.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return (
                <div className="mt-4 space-y-3 text-sm">
                  <p>
                    <strong>{u.name}</strong>
                  </p>
                  <p className="text-slate-600">{u.email}</p>
                  <p className="text-xs text-slate-500">{u.phone}</p>
                  <p className="text-xs text-slate-400">
                    {t("colOrders")}: {u.orders} · {u.lastActive}
                  </p>
                  <p className="text-xs font-semibold text-[#0066ff]">
                    {t("userColCLV")}: ₹{u.totalSpent.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {t("codRefusedScore", { n: u.codRefusedCount })}
                  </p>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t("customerOrderHistory")}
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-600">
                    {oc.map((x) => (
                      <li key={x.id} className="flex justify-between gap-2">
                        <span className="font-mono">{x.id}</span>
                        <span>₹{x.amount}</span>
                        <span className="text-slate-400">{x.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Rider Performance
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="p-2">Rider</th>
                <th className="p-2">Delivered</th>
                <th className="p-2">Cash Collected</th>
              </tr>
            </thead>
            <tbody>
              {riderPerf.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-2 text-slate-400">
                    No rider data yet.
                  </td>
                </tr>
              ) : (
                riderPerf.map((r) => (
                  <tr key={r.partnerId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2">{r.partnerName}</td>
                    <td className="p-2">{r.deliveredCount}</td>
                    <td className="p-2">Rs {r.cashCollected.toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t("returnsTitle")}
        </h3>
        <p className="text-sm text-slate-500">{t("returnsSubtitle")}</p>
        <div className="mt-3 space-y-3">
          {returns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600">
              {t("returnsEmpty")}
            </p>
          ) : null}
          {returns.map((r) => (
            <div
              key={`${r.userId ?? "u"}-${r.id}`}
              className={cn(
                "rounded-xl border p-4 dark:border-slate-700",
                r.status === "pending"
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                  : r.status === "approved"
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900"
                    : "border-rose-200 bg-rose-50/50 dark:border-rose-900"
              )}
            >
              <div className="flex flex-wrap gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold">{r.orderId}</p>
                  {r.userId ? (
                    <p className="text-[10px] font-mono text-slate-500">
                      UID: {r.userId}
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-600">{r.reason}</p>
                  <p className="text-xs uppercase text-slate-400">{r.status}</p>
                  {r.imageProofUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageProofUrl}
                      alt=""
                      className="mt-2 h-24 w-24 rounded-lg border object-cover"
                    />
                  ) : null}
                  <label className="mt-2 block text-xs font-bold text-slate-500">
                    {t("pickupSchedule")}
                    <input
                      type="datetime-local"
                      value={r.pickupDate ?? ""}
                      onChange={(e) =>
                        setReturns((prev) =>
                          prev.map((x) =>
                            x.id === r.id ? { ...x, pickupDate: e.target.value } : x
                          )
                        )
                      }
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  {r.status === "pending" ? (
                    <>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void setReturnStatus(r.id, "approved", "wallet")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          {t("approveWallet")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void setReturnStatus(r.id, "approved", "bank")}
                          className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-800"
                        >
                          {t("approveBank")}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void setReturnStatus(r.id, "rejected")}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700"
                      >
                        {t("reject")}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {r.refundMethod === "wallet"
                        ? t("refundWalletNote")
                        : r.refundMethod === "bank"
                          ? t("refundBankNote")
                          : null}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
