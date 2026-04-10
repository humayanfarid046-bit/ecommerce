"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { use, useEffect, useMemo, useState } from "react";
import {
  buildDeliveryMapsDirectionsUrl,
  buildDeliveryWhatsAppUrl,
} from "@/lib/delivery-maps-url";

type RiderOrder = {
  userId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  /** From checkout Firestore `deliveryAddress`. */
  deliveryAddress?: string;
  landmark?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
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

  const mapsHref = useMemo(() => {
    if (!order) return "";
    return buildDeliveryMapsDirectionsUrl({
      destinationAddress: order.deliveryAddress,
      destinationLat: order.deliveryLat ?? null,
      destinationLng: order.deliveryLng ?? null,
    });
  }, [order]);

  const canNavigate = useMemo(() => {
    if (!order) return false;
    const addr = order.deliveryAddress?.trim();
    const hasPin =
      order.deliveryLat != null &&
      order.deliveryLng != null &&
      Number.isFinite(order.deliveryLat) &&
      Number.isFinite(order.deliveryLng);
    return Boolean(addr) || hasPin;
  }, [order]);

  const waCustomer = useMemo(() => {
    if (!order) return null;
    return buildDeliveryWhatsAppUrl(order.customerPhone, order.orderId);
  }, [order]);

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
        <p className="mt-3 text-xs font-bold uppercase text-slate-500">Customer address</p>
        {order.deliveryAddress?.trim() ? (
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{order.deliveryAddress}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">No full address on file</p>
        )}
        {order.landmark?.trim() ? (
          <>
            <p className="mt-2 text-xs font-bold uppercase text-slate-500">Landmark</p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{order.landmark.trim()}</p>
          </>
        ) : null}
        {order.deliveryLat != null &&
        order.deliveryLng != null &&
        Number.isFinite(order.deliveryLat) &&
        Number.isFinite(order.deliveryLng) ? (
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
            GPS pin saved — Navigate uses exact coordinates.
          </p>
        ) : null}
        {!order.deliveryAddress?.trim() && !canNavigate ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Full address not on file — call the customer to confirm location.
          </p>
        ) : null}
        <p className="mt-2 text-sm">Status: {order.status}</p>
        <p className="text-sm font-semibold">COD: Rs {order.amount.toLocaleString("en-IN")}</p>
        {order.eta ? <p className="mt-1 text-sm">ETA Slot: {order.eta}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {canNavigate ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-[#0066ff] bg-[#0066ff]/10 px-3 py-1.5 text-sm font-semibold text-[#0066ff]"
            >
              Navigate
            </a>
          ) : (
            <span className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-500 dark:border-slate-600">
              Add address or pin to navigate
            </span>
          )}
          {order.customerPhone ? (
            <a
              href={`tel:${order.customerPhone}`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900"
            >
              Call customer
            </a>
          ) : null}
          {waCustomer ? (
            <a
              href={waCustomer}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100"
            >
              WhatsApp (live location)
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
