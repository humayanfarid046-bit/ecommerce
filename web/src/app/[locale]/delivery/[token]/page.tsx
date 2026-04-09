"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { use, useEffect, useMemo, useState } from "react";

type RiderOrder = {
  userId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: string;
  riderName: string;
  riderPhone: string;
  cashCollectedRupees: number;
  deliveryOtpSet: boolean;
  supportPhone: string;
  supportWhatsApp: string;
  eta: string;
  upiId: string;
};

export default function DeliveryAgentPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<RiderOrder | null>(null);
  const [otp, setOtp] = useState("");
  const [cash, setCash] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const cashNum = useMemo(() => Math.max(0, Number(cash) || 0), [cash]);
  const upiIntent = useMemo(() => {
    if (!order?.upiId) return "";
    const pa = encodeURIComponent(order.upiId);
    const tn = encodeURIComponent(`Order ${order.orderId}`);
    const am = encodeURIComponent(String(cashNum || order.amount || 0));
    return `upi://pay?pa=${pa}&pn=Local%20Commerce&tn=${tn}&am=${am}&cu=INR`;
  }, [cashNum, order]);
  const qrSrc = useMemo(() => {
    if (!upiIntent) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntent)}`;
  }, [upiIntent]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/delivery/agent?token=${encodeURIComponent(token)}`);
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          order?: RiderOrder;
        };
        if (!res.ok || !j.order) {
          setError(j.error ?? "Invalid delivery link.");
          return;
        }
        setOrder(j.order);
        setCash(String(j.order.amount || 0));
      } catch {
        setError("Failed to load delivery order.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function submit(action: "deliver" | "undelivered") {
    setBusy(true);
    try {
      const res = await fetch("/api/delivery/agent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          otp: otp.trim() || undefined,
          cashCollectedRupees: action === "deliver" ? cashNum : undefined,
          reason: action === "undelivered" ? reason.trim() || undefined : undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Failed to update.");
        return;
      }
      setError(null);
      setOrder((prev) =>
        prev ? { ...prev, status: action === "deliver" ? "delivered" : "cancelled" } : prev
      );
    } catch {
      setError("Failed to update.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="p-6">Loading…</main>;
  if (error && !order) return <main className="p-6 text-rose-600">{error}</main>;
  if (!order) return <main className="p-6">Order not found.</main>;

  return (
    <main className="mx-auto max-w-xl space-y-4 p-5">
      <h1 className="text-xl font-bold">Delivery Run</h1>
      <div className="rounded-xl border p-4">
        <p className="text-sm text-slate-500">Order</p>
        <p className="font-mono text-sm">{order.orderId}</p>
        <p className="mt-2 text-sm">{order.customerName}</p>
        <p className="text-sm">{order.customerPhone}</p>
        <p className="mt-2 text-sm">Status: {order.status}</p>
        <p className="text-sm font-semibold">COD: Rs {order.amount.toLocaleString("en-IN")}</p>
        {order.eta ? <p className="mt-1 text-sm">ETA Slot: {order.eta}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {order.customerPhone ? (
            <a
              href={`tel:${order.customerPhone}`}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              Call Customer
            </a>
          ) : null}
          {order.supportPhone ? (
            <a
              href={`tel:${order.supportPhone}`}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              Call Support
            </a>
          ) : null}
          {order.supportWhatsApp ? (
            <a
              href={`https://wa.me/${order.supportWhatsApp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              WhatsApp Support
            </a>
          ) : null}
        </div>
      </div>

      {order.status === "delivered" || order.status === "cancelled" ? null : (
        <>
          {order.deliveryOtpSet ? (
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter customer OTP"
              className="w-full rounded-lg border px-3 py-2 font-mono"
            />
          ) : null}
          <input
            value={cash}
            onChange={(e) => setCash(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Cash collected"
            className="w-full rounded-lg border px-3 py-2"
          />
          {order.upiId ? (
            <div className="rounded-xl border p-3">
              <p className="text-sm font-medium">Scan on Delivery (UPI)</p>
              {qrSrc ? (
                <Image
                  src={qrSrc}
                  alt="UPI QR"
                  width={160}
                  height={160}
                  unoptimized
                  className="mt-2 h-40 w-40 rounded-lg border object-cover"
                />
              ) : null}
              <p className="mt-2 text-xs text-slate-500">UPI ID: {order.upiId}</p>
              {upiIntent ? (
                <a
                  href={upiIntent}
                  className="mt-2 inline-block rounded-lg border px-3 py-1.5 text-sm font-medium"
                >
                  Open UPI App
                </a>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("deliver")}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
          >
            Mark Delivered
          </button>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Undelivered reason"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("undelivered")}
            className="w-full rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
          >
            Mark Undelivered (Auto Restock)
          </button>
        </>
      )}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {order.status === "delivered" ? (
        <Link
          href={`/help?orderId=${encodeURIComponent(order.orderId)}&type=feedback`}
          className="inline-block rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Request Customer Feedback
        </Link>
      ) : null}
    </main>
  );
}
