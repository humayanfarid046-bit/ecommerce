import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { UserOrderRecord } from "@/lib/user-order-firestore";
import { verifyModuleAccess } from "@/lib/server-access";
import { processInventoryReturn } from "@/lib/server-inventory";
import { notifyDeliveryOps } from "@/lib/delivery-ops-notify";
import { getServerDeliveryPolicy } from "@/lib/server-delivery-policy";

export async function PATCH(req: Request) {
  const gate = await verifyModuleAccess(req, "orders");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const body = (await req.json()) as {
    userId?: string;
    orderId?: string;
    shipmentStep?: number;
    status?: UserOrderRecord["status"];
    trackingId?: string;
    timelineNote?: string;
    eta?: string;
    hubCity?: string;
    riderName?: string;
    riderPhone?: string;
    riderToken?: string;
    deliveryOtp?: string;
    deliveryOtpAttempt?: string;
    cashCollectedRupees?: number;
    undeliveredReason?: string;
    action?: "mark_undelivered" | "revoke_rider_token" | "stock_in_rto";
    lineItems?: Array<{ variantId?: string; productId?: string; qty?: number }>;
    riderTokenExpiresAt?: number;
    deliveryPartnerId?: string;
    deliveryPartnerName?: string;
    /** Admin emergency: mark delivered without OTP when customer cannot receive SMS. */
    skipOtpVerification?: boolean;
  };
  const { userId, orderId } = body;
  if (!userId?.trim() || !orderId?.trim()) {
    return NextResponse.json(
      { error: "userId and orderId are required" },
      { status: 400 }
    );
  }
  const step = body.shipmentStep;
  if (step != null && (step < 0 || step > 3 || !Number.isInteger(step))) {
    return NextResponse.json(
      { error: "shipmentStep must be integer 0–3" },
      { status: 400 }
    );
  }
  const patch: Record<string, unknown> = {
    updatedAt: Date.now(),
  };
  if (step != null) patch.shipmentStep = step;
  if (body.status) patch.status = body.status;
  if (body.trackingId !== undefined) patch.trackingId = body.trackingId;
  if (body.timelineNote !== undefined) patch.timelineNote = body.timelineNote;
  if (body.eta !== undefined) patch.eta = body.eta;
  if (body.hubCity !== undefined) patch.hubCity = body.hubCity;
  if (body.riderName !== undefined) patch.riderName = body.riderName;
  if (body.riderPhone !== undefined) patch.riderPhone = body.riderPhone;
  if (body.riderToken !== undefined) patch.riderToken = body.riderToken;
  if (body.deliveryPartnerId !== undefined) patch.deliveryPartnerId = body.deliveryPartnerId;
  if (body.deliveryPartnerName !== undefined) patch.deliveryPartnerName = body.deliveryPartnerName;
  if (body.riderToken !== undefined) {
    const policy = await getServerDeliveryPolicy(db);
    patch.riderTokenExpiresAt =
      Date.now() + policy.riderTokenExpiryHours * 60 * 60 * 1000;
    patch.riderTokenRevokedAt = null;
  }
  if (body.deliveryOtp !== undefined) {
    patch.deliveryOtp = String(body.deliveryOtp).replace(/\D/g, "").slice(0, 6);
  }
  if (body.cashCollectedRupees !== undefined) {
    patch.cashCollectedRupees = Math.max(0, Number(body.cashCollectedRupees) || 0);
  }

  const orderRef = db.doc(`users/${userId.trim()}/orders/${orderId.trim()}`);
  const existingSnap = await orderRef.get();
  const existing = (existingSnap.data() ?? {}) as Record<string, unknown>;

  /** Reassigning the app-logged-in rider invalidates anonymous /delivery/[token] links for safety. */
  if (body.deliveryPartnerId !== undefined && body.riderToken === undefined) {
    const newPid = String(body.deliveryPartnerId).trim();
    const oldPid =
      typeof existing.deliveryPartnerId === "string"
        ? existing.deliveryPartnerId.trim()
        : "";
    const hadToken = typeof existing.riderToken === "string" && existing.riderToken.length > 0;
    if (hadToken && newPid !== oldPid) {
      patch.riderTokenRevokedAt = Date.now();
    }
  }

  if (body.action === "stock_in_rto") {
    if (existing.rtoPendingStockIn !== true) {
      return NextResponse.json({ error: "No pending RTO stock-in for this order." }, { status: 400 });
    }
    const rawLineItems = Array.isArray(existing.lineItems)
      ? (existing.lineItems as Array<{ variantId?: string; productId?: string; qty?: number }>)
      : [];
    const lines = rawLineItems
      .map((x) => {
        const variantId = typeof x.variantId === "string" ? x.variantId.trim() : "";
        const productId =
          typeof x.productId === "string" && x.productId.trim()
            ? x.productId.trim()
            : variantId;
        const qty = Math.max(0, Math.floor(Number(x.qty) || 0));
        if (!variantId || !qty) return null;
        return { variantId, productId, qty };
      })
      .filter((x): x is { variantId: string; productId: string; qty: number } => Boolean(x));
    if (lines.length > 0) {
      await processInventoryReturn(db, {
        orderId: orderId.trim(),
        userId: userId.trim(),
        actorUid: gate.uid,
        kind: "rto",
        disposition: "sellable",
        lines,
        note: "Admin stock-in after rider RTO",
      });
    }
    patch.rtoPendingStockIn = false;
    patch.rtoStockInAt = Date.now();
    patch.updatedAt = Date.now();
    await orderRef.set(patch, { merge: true });
    return NextResponse.json({ ok: true, received: lines.length });
  }

  if (body.status === "delivered") {
    const requiredOtp =
      typeof existing.deliveryOtp === "string" ? existing.deliveryOtp.trim() : "";
    if (requiredOtp) {
      const bypass = Boolean(body.skipOtpVerification);
      if (!bypass) {
        const attempt = String(body.deliveryOtpAttempt ?? "")
          .replace(/\D/g, "")
          .slice(0, 6);
        if (attempt !== requiredOtp) {
          return NextResponse.json(
            { error: "Delivery OTP mismatch. Cannot mark delivered." },
            { status: 400 }
          );
        }
      } else {
        patch.deliveryOtpBypassAt = Date.now();
        patch.deliveryOtpBypassBy = gate.uid;
      }
      patch.deliveryOtpVerifiedAt = Date.now();
    }
    patch.deliveredAt = new Date().toISOString();
    await notifyDeliveryOps({
      event: "delivery_completed",
      orderId: orderId.trim(),
      customerName: typeof existing.customerName === "string" ? existing.customerName : undefined,
      customerPhone:
        typeof existing.customerPhone === "string" ? existing.customerPhone : undefined,
      riderName: typeof existing.riderName === "string" ? existing.riderName : undefined,
      riderPhone: typeof existing.riderPhone === "string" ? existing.riderPhone : undefined,
      eta: typeof body.eta === "string" ? body.eta : undefined,
    });
  }

  if (body.action === "mark_undelivered") {
    const rawLineItems = Array.isArray(body.lineItems)
      ? body.lineItems
      : Array.isArray(existing.lineItems)
        ? (existing.lineItems as Array<{ variantId?: string; productId?: string; qty?: number }>)
        : [];
    const lines = rawLineItems
      .map((x) => {
        const variantId = typeof x.variantId === "string" ? x.variantId.trim() : "";
        const productId =
          typeof x.productId === "string" && x.productId.trim()
            ? x.productId.trim()
            : variantId;
        const qty = Math.max(0, Math.floor(Number(x.qty) || 0));
        if (!variantId || !qty) return null;
        return { variantId, productId, qty };
      })
      .filter((x): x is { variantId: string; productId: string; qty: number } => Boolean(x));

    if (lines.length > 0) {
      await processInventoryReturn(db, {
        orderId: orderId.trim(),
        userId: userId.trim(),
        actorUid: gate.uid,
        kind: "rto",
        disposition: "sellable",
        lines,
        note: body.undeliveredReason?.trim() || "Undelivered auto-restock",
      });
    }
    patch.status = "cancelled";
    patch.undeliveredReason = body.undeliveredReason?.trim() || "Undelivered";
    await notifyDeliveryOps({
      event: "delivery_undelivered",
      orderId: orderId.trim(),
      customerName: typeof existing.customerName === "string" ? existing.customerName : undefined,
      customerPhone:
        typeof existing.customerPhone === "string" ? existing.customerPhone : undefined,
      riderName: typeof existing.riderName === "string" ? existing.riderName : undefined,
      riderPhone: typeof existing.riderPhone === "string" ? existing.riderPhone : undefined,
      note: patch.undeliveredReason as string,
    });
  }
  if (body.action === "revoke_rider_token") {
    patch.riderTokenRevokedAt = Date.now();
  }
  if (body.status === "out_for_delivery" || body.shipmentStep === 2) {
    await notifyDeliveryOps({
      event: body.riderName || body.riderPhone ? "delivery_assigned" : "out_for_delivery",
      orderId: orderId.trim(),
      customerName: typeof existing.customerName === "string" ? existing.customerName : undefined,
      customerPhone:
        typeof existing.customerPhone === "string" ? existing.customerPhone : undefined,
      riderName: typeof body.riderName === "string" ? body.riderName : undefined,
      riderPhone: typeof body.riderPhone === "string" ? body.riderPhone : undefined,
      eta: typeof body.eta === "string" ? body.eta : undefined,
    });
  }
  await orderRef.set(patch, {
    merge: true,
  });
  return NextResponse.json({ ok: true });
}
