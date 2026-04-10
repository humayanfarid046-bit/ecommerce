"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { DeliveryPartnerAppBar } from "@/components/delivery-partner-app-bar";
import { SignaturePad } from "@/components/signature-pad";

type DeliveryOrder = {
  userId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  amount: number;
  paymentStatus: "PENDING" | "PAID";
  lineItems: Array<{
    variantId: string;
    productId: string;
    qty: number;
    productTitle?: string;
  }>;
  itemTitle: string;
  otpRequired: boolean;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export default function DeliveryDashboardPage() {
  const [rows, setRows] = useState<DeliveryOrder[]>([]);
  const [history, setHistory] = useState<
    Array<{ orderId: string; amount: number; paidAt: string; paymentStatus: "PENDING" | "PAID"; collectedVia: string }>
  >([]);
  const [todaySummary, setTodaySummary] = useState({
    totalOrders: 0,
    pending: 0,
    completed: 0,
    cashCollected: 0,
  });
  const [dutyOnline, setDutyOnline] = useState(false);
  const [wallet, setWallet] = useState({ cashInHandRupees: 0, lifetimeOnlineRupees: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [qrOtp, setQrOtp] = useState("");
  const [qrPopup, setQrPopup] = useState<{
    userId: string;
    orderId: string;
    keyId: string;
    rzOrderId: string;
    amount: number;
    otpRequired: boolean;
  } | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    order: DeliveryOrder;
    method: "cash" | "partial";
    otp: string;
    cashAmount: string;
    onlineAmount: string;
    signature: string;
  } | null>(null);
  const [rtoModal, setRtoModal] = useState<{ order: DeliveryOrder; reason: string } | null>(null);

  async function load() {
    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken();
      if (!token) {
        setError("Please login.");
        return;
      }
      const res = await fetch("/api/delivery/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        orders?: DeliveryOrder[];
        history?: Array<{ orderId: string; amount: number; paidAt: string; paymentStatus: "PENDING" | "PAID"; collectedVia: string }>;
        todaySummary?: { totalOrders?: number; pending?: number; completed?: number; cashCollected?: number };
        dutyOnline?: boolean;
        wallet?: { cashInHandRupees?: number; lifetimeOnlineRupees?: number };
      };
      if (!res.ok) {
        setError(j.error ?? "Failed to load delivery orders.");
        return;
      }
      setWallet({
        cashInHandRupees: Number(j.wallet?.cashInHandRupees ?? 0),
        lifetimeOnlineRupees: Number(j.wallet?.lifetimeOnlineRupees ?? 0),
      });
      setRows(Array.isArray(j.orders) ? j.orders : []);
      setHistory(Array.isArray(j.history) ? j.history : []);
      setTodaySummary({
        totalOrders: Number(j.todaySummary?.totalOrders ?? 0),
        pending: Number(j.todaySummary?.pending ?? 0),
        completed: Number(j.todaySummary?.completed ?? 0),
        cashCollected: Number(j.todaySummary?.cashCollected ?? 0),
      });
      setDutyOnline(Boolean(j.dutyOnline));
      setError(null);
    } catch {
      setError("Failed to load delivery orders.");
    }
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!dutyOnline || typeof navigator === "undefined" || !navigator.geolocation) return;
    let watch = 0;
    const tick = () => {
      void (async () => {
        try {
          const token = await getFirebaseAuth()?.currentUser?.getIdToken();
          if (!token) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              void fetch("/api/delivery/dashboard", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  action: "update_location",
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                }),
              });
            },
            () => {
              /* user denied or unavailable */
            },
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 }
          );
        } catch {
          /* ignore */
        }
      })();
    };
    tick();
    watch = window.setInterval(tick, 90000);
    return () => window.clearInterval(watch);
  }, [dutyOnline]);

  const totalCash = useMemo(
    () => Number(todaySummary.cashCollected || 0),
    [todaySummary.cashCollected]
  );

  async function collect(o: DeliveryOrder, method: "cash" | "qr") {
    if (method === "cash") {
      setPaymentModal({
        order: o,
        method: "cash",
        otp: "",
        cashAmount: String(o.amount),
        onlineAmount: "0",
        signature: "",
      });
      return;
    }
    setBusyOrder(o.orderId);
    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken();
      if (!token) {
        setError("Please login.");
        return;
      }
      const res = await fetch("/api/delivery/dashboard", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: o.userId,
          orderId: o.orderId,
          paymentMethod: method,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        qrOrder?: { orderId: string; amount: number; currency: string; keyId: string };
      };
      if (!res.ok) {
        setError(j.error ?? "Action failed.");
        return;
      }
      if (j.qrOrder) {
        setQrOtp("");
        setQrPopup({
          userId: o.userId,
          orderId: o.orderId,
          keyId: j.qrOrder.keyId,
          rzOrderId: j.qrOrder.orderId,
          amount: j.qrOrder.amount,
          otpRequired: o.otpRequired,
        });
      }
    } catch {
      setError("Action failed.");
    } finally {
      setBusyOrder(null);
    }
  }

  async function toggleDuty(next: boolean) {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    if (!token) return;
    const res = await fetch("/api/delivery/dashboard", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "toggle_duty", online: next }),
    });
    if (res.ok) {
      setDutyOnline(next);
      setError(null);
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setError(j.error ?? "Could not update duty status.");
  }

  async function patchMarkDeliveredQr(
    popup: NonNullable<typeof qrPopup>,
    otp: string,
    rz: RazorpaySuccess | null
  ) {
    const digits = otp.replace(/\D/g, "").slice(0, 6);
    if (popup.otpRequired && digits.length !== 6) {
      setError("Enter the 6-digit delivery OTP from the customer.");
      return;
    }
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    if (!token) {
      setError("Please login.");
      return;
    }
    const body: Record<string, unknown> = {
      userId: popup.userId,
      orderId: popup.orderId,
      paymentMethod: "qr_confirm",
      otp: digits,
    };
    if (rz) {
      body.razorpay_order_id = rz.razorpay_order_id;
      body.razorpay_payment_id = rz.razorpay_payment_id;
      body.razorpay_signature = rz.razorpay_signature;
    }
    const res = await fetch("/api/delivery/dashboard", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(j.error ?? "Could not complete delivery.");
      return;
    }
    setQrPopup(null);
    setQrOtp("");
    await load();
  }

  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const w = window as unknown as { Razorpay?: unknown };
      if (w.Razorpay) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("script"));
      document.body.appendChild(s);
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DeliveryPartnerAppBar />
      <main className="mx-auto max-w-md space-y-3 p-4 pb-16">
        <h1 className="text-xl font-black">Delivery Dashboard</h1>
        <p className="text-xs text-slate-400">Assigned out-for-delivery orders only</p>
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
          <span>Duty Status</span>
          <button
            type="button"
            onClick={() => void toggleDuty(!dutyOnline)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${dutyOnline ? "bg-emerald-600" : "bg-slate-700"}`}
          >
            {dutyOnline ? "Online" : "Offline"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-2">Total: {todaySummary.totalOrders}</div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-2">Pending: {todaySummary.pending}</div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-2">Done: {todaySummary.completed}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
          <p className="text-xs text-slate-400">Today — cash marked received (session)</p>
          <p className="font-semibold text-white">
            Rs {totalCash.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-sm">
          <p className="text-xs font-bold text-amber-200/90">Cash with you (give to admin)</p>
          <p className="text-lg font-black text-white">
            Rs {wallet.cashInHandRupees.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            Online/UPI recorded (lifetime): Rs{" "}
            {wallet.lifetimeOnlineRupees.toLocaleString("en-IN")}
          </p>
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {rows.map((o) => (
          <div key={o.orderId} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <p className="font-bold">{o.customerName}</p>
            <div className="mt-2 flex gap-2">
              <a href={`tel:${o.customerPhone}`} className="rounded-lg border border-slate-600 px-3 py-1 text-xs">
                Call
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.address || o.customerName)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-600 px-3 py-1 text-xs"
              >
                Navigate
              </a>
            </div>
            <p className="mt-2 text-xs text-slate-300">{o.address || "Address not available"}</p>
            <p className="mt-2 font-semibold">Collect: Rs {o.amount.toLocaleString("en-IN")}</p>
            {o.itemTitle ? <p className="mt-1 text-xs text-slate-400">Items: {o.itemTitle}</p> : null}
            {o.lineItems.length ? (
              <ul className="mt-1 list-disc pl-4 text-xs text-slate-400">
                {o.lineItems.map((x, i) => (
                  <li key={`${x.variantId}-${i}`}>
                    <span className="font-medium text-slate-200">
                      {x.productTitle || x.productId}
                    </span>
                    {x.variantId ? ` · ${x.variantId}` : ""} × {x.qty}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyOrder === o.orderId}
                onClick={() => void collect(o, "cash")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold"
              >
                Cash Received
              </button>
              <button
                type="button"
                disabled={busyOrder === o.orderId}
                onClick={() => void collect(o, "qr")}
                className="rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-bold"
              >
                Generate QR Code
              </button>
              <button
                type="button"
                onClick={() =>
                  setPaymentModal({
                    order: o,
                    method: "partial",
                    otp: "",
                    cashAmount: String(Math.floor(o.amount / 2)),
                    onlineAmount: String(o.amount - Math.floor(o.amount / 2)),
                    signature: "",
                  })
                }
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold"
              >
                Partial Payment
              </button>
              <button
                type="button"
                disabled={busyOrder === o.orderId}
                onClick={() => setRtoModal({ order: o, reason: "" })}
                className="rounded-lg border border-rose-500 px-3 py-1.5 text-xs font-bold text-rose-200"
              >
                Return / RTO
              </button>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
          <p className="text-sm font-bold">Delivery History</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {history.length === 0 ? <li>No completed deliveries yet.</li> : null}
            {history.slice(0, 20).map((h) => (
              <li key={h.orderId} className="flex justify-between">
                <span>{h.orderId}</span>
                <span>Rs {h.amount.toLocaleString("en-IN")} · {h.collectedVia}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
      {qrPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 p-4">
            <p className="text-sm font-bold">Online payment (Razorpay)</p>
            <p className="mt-1 text-xs text-slate-400">Order: {qrPopup.orderId}</p>
            <p className="text-xs text-slate-400">Razorpay order: {qrPopup.rzOrderId}</p>
            <p className="text-xs text-slate-400">
              Amount: Rs {(qrPopup.amount / 100).toLocaleString("en-IN")}
            </p>
            {qrPopup.otpRequired ? (
              <input
                value={qrOtp}
                onChange={(e) =>
                  setQrOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Customer delivery OTP (6 digits)"
                className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-2 text-sm font-mono tracking-widest"
                inputMode="numeric"
              />
            ) : null}
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  setError(null);
                  const popup = qrPopup;
                  try {
                    await loadRazorpayScript();
                  } catch {
                    setError("Could not load Razorpay.");
                    return;
                  }
                  const w = window as unknown as {
                    Razorpay: new (opts: {
                      key: string;
                      amount: number;
                      currency: string;
                      order_id: string;
                      name: string;
                      description?: string;
                      handler: (response: RazorpaySuccess) => void;
                    }) => { open: () => void };
                  };
                  const Rzp = w.Razorpay;
                  const rzp = new Rzp({
                    key: popup.keyId,
                    amount: popup.amount,
                    currency: "INR",
                    order_id: popup.rzOrderId,
                    name: "Order payment",
                    description: popup.orderId,
                    handler: (response: RazorpaySuccess) => {
                      void patchMarkDeliveredQr(popup, qrOtp, response);
                    },
                  });
                  rzp.open();
                })();
              }}
              className="mt-3 w-full rounded-lg bg-[#0066ff] px-3 py-2.5 text-xs font-bold text-white"
            >
              Pay with Razorpay
            </button>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              After successful payment, delivery is marked automatically (OTP verified on server when
              required).
            </p>
            {typeof window !== "undefined" && window.location.hostname === "localhost" ? (
              <button
                type="button"
                onClick={() => void patchMarkDeliveredQr(qrPopup, qrOtp, null)}
                className="mt-2 w-full rounded-lg border border-amber-700/60 px-3 py-2 text-[11px] font-bold text-amber-200"
              >
                Dev: mark delivered without Razorpay proof
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setQrPopup(null);
                setQrOtp("");
              }}
              className="mt-3 w-full rounded-lg border border-slate-600 px-3 py-2 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      {rtoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 p-4">
            <p className="text-sm font-bold">Mark return (RTO)</p>
            <p className="mt-1 text-xs text-slate-400">
              Customer refused or could not take delivery. Admin will restock inventory later.
            </p>
            <textarea
              value={rtoModal.reason}
              onChange={(e) =>
                setRtoModal((m) => (m ? { ...m, reason: e.target.value } : m))
              }
              placeholder="Reason (optional)"
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={async () => {
                const token = await getFirebaseAuth()?.currentUser?.getIdToken();
                if (!token || !rtoModal) return;
                setBusyOrder(rtoModal.order.orderId);
                const res = await fetch("/api/delivery/dashboard", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    action: "mark_rto",
                    userId: rtoModal.order.userId,
                    orderId: rtoModal.order.orderId,
                    reason: rtoModal.reason.trim(),
                  }),
                });
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                setBusyOrder(null);
                if (!res.ok) {
                  setError(j.error ?? "Could not mark RTO.");
                  return;
                }
                setRtoModal(null);
                await load();
              }}
              className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              Confirm RTO
            </button>
            <button
              type="button"
              onClick={() => setRtoModal(null)}
              className="mt-2 rounded-lg border border-slate-600 px-3 py-1.5 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      {paymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 p-4">
            <p className="text-sm font-bold">Payment & OTP</p>
            <p className="mt-1 text-xs text-slate-400">Order: {paymentModal.order.orderId}</p>
            <input
              value={paymentModal.otp}
              onChange={(e) =>
                setPaymentModal((m) => (m ? { ...m, otp: e.target.value.replace(/\D/g, "").slice(0, 6) } : m))
              }
              placeholder="Delivery OTP"
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs"
            />
            <input
              value={paymentModal.cashAmount}
              onChange={(e) => setPaymentModal((m) => (m ? { ...m, cashAmount: e.target.value } : m))}
              placeholder="Cash amount"
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs"
            />
            {paymentModal.method === "partial" ? (
              <input
                value={paymentModal.onlineAmount}
                onChange={(e) =>
                  setPaymentModal((m) => (m ? { ...m, onlineAmount: e.target.value } : m))
                }
                placeholder="Online amount"
                className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs"
              />
            ) : null}
            <div className="mt-2">
              <SignaturePad
                onChange={(v) => setPaymentModal((m) => (m ? { ...m, signature: v } : m))}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                const token = await getFirebaseAuth()?.currentUser?.getIdToken();
                if (!token || !paymentModal) return;
                const res = await fetch("/api/delivery/dashboard", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    action: "collect",
                    userId: paymentModal.order.userId,
                    orderId: paymentModal.order.orderId,
                    paymentMethod: paymentModal.method,
                    otp: paymentModal.otp,
                    cashAmount: Number(paymentModal.cashAmount || 0),
                    onlineAmount: Number(paymentModal.onlineAmount || 0),
                    signature: paymentModal.signature,
                  }),
                });
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                if (!res.ok) {
                  setError(j.error ?? "Failed to confirm payment.");
                  return;
                }
                setPaymentModal(null);
                await load();
              }}
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold"
            >
              Confirm & Mark Delivered
            </button>
            <button
              type="button"
              onClick={() => setPaymentModal(null)}
              className="mt-2 rounded-lg border border-slate-600 px-3 py-1.5 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

