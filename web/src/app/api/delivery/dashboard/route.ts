import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyUserIdToken } from "@/lib/verify-user-token";
import { getUserRole } from "@/lib/server-rbac";
import { parseUserOrderDocument } from "@/lib/user-order-firestore";
import { creditRiderWalletOnDelivery } from "@/lib/server-rider-wallet";

export async function GET(req: Request) {
  const auth = await verifyUserIdToken(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const role = await getUserRole(db, auth.uid);
  if (role !== "DELIVERY_PARTNER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const dutySnap = await db.doc(`users/${auth.uid}/profile/delivery`).get();
  const dutyData = (dutySnap.data() ?? {}) as Record<string, unknown>;
  const dutyOnline = Boolean(dutyData.online);
  const lastLat =
    typeof dutyData.lastLat === "number" && Number.isFinite(dutyData.lastLat)
      ? dutyData.lastLat
      : null;
  const lastLng =
    typeof dutyData.lastLng === "number" && Number.isFinite(dutyData.lastLng)
      ? dutyData.lastLng
      : null;

  const liveSnap = await db
    .collectionGroup("orders")
    .where("deliveryPartnerId", "==", auth.uid)
    .where("status", "==", "out_for_delivery")
    .limit(200)
    .get();
  const historySnap = await db
    .collectionGroup("orders")
    .where("deliveryPartnerId", "==", auth.uid)
    .where("status", "==", "delivered")
    .limit(200)
    .get();

  const orders = liveSnap.docs.map((doc) => {
    const p = doc.ref.path.split("/");
    const userId = p[1] ?? "";
    const r = parseUserOrderDocument(doc.id, doc.data() as Record<string, unknown>);
    return {
      userId,
      orderId: r.id,
      customerName: r.customerName ?? "Customer",
      customerPhone: r.customerPhone ?? "",
      address: r.deliveryAddress ?? "",
      amount: r.totalRupees,
      paymentStatus: r.paymentStatus ?? "PENDING",
      deliveryPartnerId: r.deliveryPartnerId ?? "",
      lineItems: r.lineItems ?? [],
      itemTitle: r.itemTitle ?? "",
      otpRequired: Boolean(r.deliveryOtp),
      deliveredAt: r.deliveredAt ?? "",
    };
  });
  const history = historySnap.docs.map((doc) => {
    const raw = doc.data() as Record<string, unknown>;
    const r = parseUserOrderDocument(doc.id, raw);
    const audit =
      raw.audit && typeof raw.audit === "object"
        ? (raw.audit as Record<string, unknown>)
        : undefined;
    return {
      orderId: r.id,
      amount: r.totalRupees,
      paidAt: r.paidAt ?? r.deliveredAt ?? "",
      paymentStatus: r.paymentStatus ?? "PENDING",
      collectedVia: String(audit?.collectedVia ?? "cash"),
    };
  });
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = history.filter((h) => h.paidAt.startsWith(today));
  const cashCollectedToday = completedToday
    .filter((h) => h.collectedVia === "cash" && h.paymentStatus === "PAID")
    .reduce((s, h) => s + Math.max(0, Number(h.amount) || 0), 0);
  return NextResponse.json({
    ok: true,
    dutyOnline,
    lastLat,
    lastLng,
    todaySummary: {
      totalOrders: orders.length + completedToday.length,
      pending: orders.length,
      completed: completedToday.length,
      cashCollected: cashCollectedToday,
    },
    orders,
    history: history.slice(0, 80),
  });
}

export async function PATCH(req: Request) {
  const auth = await verifyUserIdToken(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const role = await getUserRole(db, auth.uid);
  if (role !== "DELIVERY_PARTNER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    action?: "toggle_duty" | "collect" | "mark_rto" | "update_location";
    userId?: string;
    orderId?: string;
    paymentMethod?: "cash" | "qr" | "qr_confirm" | "partial";
    cashAmount?: number;
    onlineAmount?: number;
    otp?: string;
    signature?: string;
    online?: boolean;
    reason?: string;
    lat?: number;
    lng?: number;
  };
  if (body.action === "update_location") {
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    }
    await db.doc(`users/${auth.uid}/profile/delivery`).set(
      {
        lastLat: lat,
        lastLng: lng,
        locationUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }
  if (body.action === "toggle_duty") {
    await db.doc(`users/${auth.uid}/profile/delivery`).set(
      {
        online: Boolean(body.online),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, dutyOnline: Boolean(body.online) });
  }
  if (body.action === "mark_rto") {
    const userId = String(body.userId ?? "").trim();
    const orderId = String(body.orderId ?? "").trim();
    if (!userId || !orderId) {
      return NextResponse.json({ error: "userId and orderId required" }, { status: 400 });
    }
    const ref = db.doc(`users/${userId}/orders/${orderId}`);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const data = (snap.data() ?? {}) as Record<string, unknown>;
    if (String(data.deliveryPartnerId ?? "") !== auth.uid && role !== "ADMIN") {
      return NextResponse.json({ error: "Not assigned to this rider" }, { status: 403 });
    }
    if (data.status !== "out_for_delivery") {
      return NextResponse.json({ error: "Order is not out for delivery." }, { status: 400 });
    }
    const reason = String(body.reason ?? "").trim() || "RTO: customer refused delivery";
    await ref.set(
      {
        status: "cancelled",
        shipmentStep: 0,
        undeliveredReason: reason,
        rtoPendingStockIn: true,
        rtoMarkedAt: Date.now(),
        rtoMarkedById: auth.uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }
  const userId = String(body.userId ?? "").trim();
  const orderId = String(body.orderId ?? "").trim();
  if (!userId || !orderId) {
    return NextResponse.json({ error: "userId and orderId required" }, { status: 400 });
  }
  const ref = db.doc(`users/${userId}/orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const data = (snap.data() ?? {}) as Record<string, unknown>;
  if (String(data.deliveryPartnerId ?? "") !== auth.uid && role !== "ADMIN") {
    return NextResponse.json({ error: "Not assigned to this rider" }, { status: 403 });
  }
  const requiredOtp = String(data.deliveryOtp ?? "").replace(/\D/g, "").slice(0, 6);
  if (requiredOtp) {
    const entered = String(body.otp ?? "").replace(/\D/g, "").slice(0, 6);
    if (entered !== requiredOtp) {
      return NextResponse.json({ error: "OTP verification failed." }, { status: 400 });
    }
  }
  let qrOrder: { orderId: string; amount: number; currency: string; keyId: string } | null = null;
  if (body.paymentMethod === "qr") {
    const amountPaise = Math.max(100, Math.floor((Number(data.totalRupees) || 0) * 100));
    const base = new URL(req.url);
    const r = await fetch(new URL("/api/razorpay/create-order", base), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: `dlv_${orderId}` }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      return NextResponse.json({ error: j.error ?? "QR generation failed" }, { status: 400 });
    }
    const j = (await r.json()) as { orderId: string; amount: number; currency: string; keyId: string };
    qrOrder = j;
  }
  if (
    body.paymentMethod === "cash" ||
    body.paymentMethod === "qr_confirm" ||
    body.paymentMethod === "partial"
  ) {
    const nowIso = new Date().toISOString();
    const total = Math.max(0, Number(data.totalRupees) || 0);
    const cashAmount = Math.max(0, Number(body.cashAmount) || 0);
    const onlineAmount =
      body.paymentMethod === "cash"
        ? 0
        : body.paymentMethod === "qr_confirm"
          ? total
          : Math.max(0, Number(body.onlineAmount) || 0);
    const paidTotal = Math.max(0, cashAmount + onlineAmount);
    if (body.paymentMethod === "partial" && paidTotal < total) {
      return NextResponse.json({ error: "Partial payment must cover full order amount." }, { status: 400 });
    }
    if (body.paymentMethod === "cash" && cashAmount <= 0) {
      return NextResponse.json({ error: "Cash amount required." }, { status: 400 });
    }
    await ref.set(
      {
        status: "delivered",
        shipmentStep: 3,
        paymentStatus: "PAID",
        paidAt: nowIso,
        deliveredAt: nowIso,
        deliveredById: auth.uid,
        deliveredByName: String(data.deliveryPartnerName ?? "Delivery Partner"),
        audit: {
          deliveredAt: nowIso,
          deliveredById: auth.uid,
          collectedVia:
            body.paymentMethod === "cash"
              ? "cash"
              : body.paymentMethod === "partial"
                ? "partial"
                : "qr",
          cashAmount,
          onlineAmount,
          signature: String(body.signature ?? "").slice(0, 120),
        },
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    await creditRiderWalletOnDelivery(db, auth.uid, {
      cashRupees: cashAmount,
      onlineRupees: onlineAmount,
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true, qrOrder });
}

