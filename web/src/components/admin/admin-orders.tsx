"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mockAdminOrders,
  mockReturns,
  type AdminOrderRow,
  type AdminReturnReq,
  type AdminUserRow,
} from "@/lib/admin-mock-data";
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
      return "shipped";
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
  const getAuthHeader = useCallback(async () => {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const t = useTranslations("admin");
  const [orders, setOrders] = useState<AdminOrderRow[]>(mockAdminOrders);
  const [userIndex, setUserIndex] = useState<AdminUserRow[]>([]);
  const [returns, setReturns] = useState<AdminReturnReq[]>(mockReturns);

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const headers = await getAuthHeader();
        const [resO, resU] = await Promise.all([
          fetch("/api/admin/orders", { headers }),
          fetch("/api/admin/users", { headers }),
        ]);
        const resR = await fetch("/api/admin/returns", { headers });
        const jO = (await resO.json().catch(() => ({}))) as {
          orders?: AdminOrderRow[];
        };
        const jU = (await resU.json().catch(() => ({}))) as {
          users?: AdminUserRow[];
        };
        const jR = (await resR.json().catch(() => ({}))) as {
          returns?: AdminReturnReq[];
        };
        if (cancelled) return;
        if (resO.ok && Array.isArray(jO.orders)) {
          setOrders(jO.orders);
          for (const o of jO.orders) {
            try {
              setAdminOrderFirebaseUid(o.id, o.customerId);
            } catch {
              /* ignore */
            }
          }
        }
        if (resU.ok && Array.isArray(jU.users)) {
          setUserIndex(jU.users);
        }
        if (resR.ok && Array.isArray(jR.returns)) {
          setReturns(jR.returns);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAuthHeader]);

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
    (id: string, status: AdminOrderRow["status"]) => {
      setOrders((prev) => {
        const row = prev.find((o) => o.id === id);
        if (row?.customerId) {
          void (async () => {
            try {
              await fetch("/api/admin/order", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...(await getAuthHeader()),
                },
                body: JSON.stringify({
                  userId: row.customerId,
                  orderId: id,
                  shipmentStep: statusToStep(status),
                  status: mapAdminStatusToFirestore(status),
                }),
              });
            } catch {
              /* ignore */
            }
          })();
        }
        return prev.map((o) => (o.id === id ? { ...o, status } : o));
      });
      setOrderTracking(id, { step: statusToStep(status) });
      dispatchOrderTrackingEvent();
    },
    [getAuthHeader]
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
      window.alert(t("trackingSavedLocalOnly"));
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
        window.alert(j.error ?? t("trackingSaveFailed"));
        return;
      }
      window.alert(t("trackingSavedFirestore"));
    } catch {
      window.alert(t("trackingSaveFailed"));
    } finally {
      setTrackingBusy(false);
    }
  };

  const fetchCourierDemo = () => {
    if (!ensureMisleadingDemoAllowed()) {
      window.alert("This action is disabled in production for safety.");
      return;
    }
    window.alert(t("courierFetchDemo"));
  };

  const notifyDemo = () => {
    if (!ensureMisleadingDemoAllowed()) {
      window.alert("This action is disabled in production for safety.");
      return;
    }
    window.alert(t("notifyWhatsAppDemo"));
  };

  const bulkShipped = () => {
    if (!ensureMisleadingDemoAllowed()) {
      window.alert("This bulk demo action is disabled in production.");
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
    window.alert(t("bulkShippedDemo", { n }));
  };

  const bulkInvoices = () => {
    if (!ensureMisleadingDemoAllowed()) {
      window.alert("This bulk demo action is disabled in production.");
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
  };

  const setReturnStatus = async (
    id: string,
    status: AdminReturnReq["status"],
    refund?: "wallet" | "bank"
  ) => {
    const row = returns.find((r) => r.id === id);
    const uid = row?.userId?.trim();
    if (!row || !uid) {
      window.alert(t("returnMissingUserId"));
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
        window.alert(j.error ?? t("returnUpdateFailed"));
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
      window.alert(t("returnUpdateFailed"));
    }
  };

  const customerOrders = (cid: string) => orders.filter((o) => o.customerId === cid);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("ordersTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("ordersSubtitle")}</p>
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
              <th className="p-3 font-bold">{t("colCodPanel")}</th>
              <th className="p-3 font-bold">{t("colStatus")}</th>
              <th className="p-3 font-bold">{t("colPlaced")}</th>
              <th className="p-3 font-bold">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
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
                    <select
                      value={o.status}
                      onChange={(e) =>
                        setStatus(o.id, e.target.value as AdminOrderRow["status"])
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-600 dark:bg-slate-950"
                    >
                      <option value="pending">{t("status_pending")}</option>
                      <option value="shipped">{t("status_shipped")}</option>
                      <option value="delivered">{t("status_delivered")}</option>
                      <option value="cancelled">{t("status_cancelled")}</option>
                    </select>
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
                    <td colSpan={11} className="p-4">
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
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
            })}
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

      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          {t("returnsTitle")}
        </h3>
        <p className="text-sm text-slate-500">{t("returnsSubtitle")}</p>
        <div className="mt-3 space-y-3">
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
