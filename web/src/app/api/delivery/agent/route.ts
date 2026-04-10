import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { parseUserOrderDocument } from "@/lib/user-order-firestore";
import { processInventoryReturn } from "@/lib/server-inventory";
import { notifyDeliveryOps } from "@/lib/delivery-ops-notify";
import { creditRiderWalletOnDelivery } from "@/lib/server-rider-wallet";

function normalizeOtp(v: unknown): string {
  return String(v ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

function tokenState(row: Record<string, unknown>): "ok" | "expired" | "revoked" {
  const now = Date.now();
  const revokedAt =
    typeof row.riderTokenRevokedAt === "number" ? row.riderTokenRevokedAt : 0;
  if (revokedAt > 0) return "revoked";
  const expiresAt =
    typeof row.riderTokenExpiresAt === "number" ? row.riderTokenExpiresAt : 0;
  if (expiresAt > 0 && now > expiresAt) return "expired";
  return "ok";
}

export async function GET(req: Request) {
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 503 });
  }
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  const snap = await db
    .collectionGroup("orders")
    .where("riderToken", "==", token)
    .limit(1)
    .get();
  if (snap.empty) {
    return NextResponse.json({ error: "Invalid delivery link." }, { status: 404 });
  }
  const doc = snap.docs[0]!;
  const parts = doc.ref.path.split("/");
  const userId = parts[1] ?? "";
  const orderId = doc.id;
  const raw = doc.data() as Record<string, unknown>;
  const state = tokenState(raw);
  if (state !== "ok") {
    return NextResponse.json(
      { error: state === "revoked" ? "Delivery link revoked." : "Delivery link expired." },
      { status: 410 }
    );
  }
  const parsed = parseUserOrderDocument(orderId, raw);
  return NextResponse.json({
    ok: true,
    order: {
      userId,
      orderId,
      customerName: parsed.customerName ?? "Customer",
      customerPhone: parsed.customerPhone ?? "",
      /** Same field as checkout / logged-in rider dashboard — full delivery line. */
      deliveryAddress: parsed.deliveryAddress?.trim() ?? "",
      landmark: parsed.deliveryLandmark?.trim() ?? "",
      deliveryLat:
        typeof parsed.deliveryLat === "number" && Number.isFinite(parsed.deliveryLat)
          ? parsed.deliveryLat
          : null,
      deliveryLng:
        typeof parsed.deliveryLng === "number" && Number.isFinite(parsed.deliveryLng)
          ? parsed.deliveryLng
          : null,
      amount: parsed.totalRupees,
      status: parsed.status,
      riderName: parsed.riderName ?? "",
      riderPhone: parsed.riderPhone ?? "",
      cashCollectedRupees: parsed.cashCollectedRupees ?? 0,
      deliveryOtpSet: Boolean(parsed.deliveryOtp),
      lineItems: parsed.lineItems ?? [],
      supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "",
      eta: parsed.eta ?? "",
      supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "",
      upiId: process.env.NEXT_PUBLIC_DELIVERY_UPI_ID ?? "",
    },
  });
}

export async function PATCH(req: Request) {
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 503 });
  }
  const body = (await req.json()) as {
    token?: string;
    action?: "deliver" | "undelivered";
    otp?: string;
    cashCollectedRupees?: number;
    reason?: string;
  };
  const token = body.token?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  const snap = await db
    .collectionGroup("orders")
    .where("riderToken", "==", token)
    .limit(1)
    .get();
  if (snap.empty) {
    return NextResponse.json({ error: "Invalid delivery link." }, { status: 404 });
  }
  const doc = snap.docs[0]!;
  const parts = doc.ref.path.split("/");
  const userId = parts[1] ?? "";
  const orderId = doc.id;
  const raw = doc.data() as Record<string, unknown>;
  const state = tokenState(raw);
  if (state !== "ok") {
    return NextResponse.json(
      { error: state === "revoked" ? "Delivery link revoked." : "Delivery link expired." },
      { status: 410 }
    );
  }
  const parsed = parseUserOrderDocument(orderId, raw);
  const action = body.action;
  if (action !== "deliver" && action !== "undelivered") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "deliver") {
    const requiredOtp = parsed.deliveryOtp?.trim() ?? "";
    if (requiredOtp) {
      if (normalizeOtp(body.otp) !== requiredOtp) {
        return NextResponse.json({ error: "OTP mismatch" }, { status: 400 });
      }
    }
    const cashCollected = Math.max(0, Number(body.cashCollectedRupees) || 0);
    await doc.ref.set(
      {
        status: "delivered",
        shipmentStep: 3,
        deliveryOtpVerifiedAt: Date.now(),
        deliveredAt: new Date().toISOString(),
        cashCollectedRupees: cashCollected,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    const riderUid =
      typeof raw.deliveryPartnerId === "string" ? raw.deliveryPartnerId.trim() : "";
    if (riderUid && cashCollected > 0) {
      await creditRiderWalletOnDelivery(db, riderUid, {
        cashRupees: cashCollected,
        onlineRupees: 0,
      });
    }
    await notifyDeliveryOps({
      event: "delivery_completed",
      orderId,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      riderName: parsed.riderName,
      riderPhone: parsed.riderPhone,
      eta: parsed.eta,
    });
    return NextResponse.json({ ok: true });
  }

  const lines = (parsed.lineItems ?? []).filter((x) => x.qty > 0 && x.variantId);
  if (lines.length > 0) {
    await processInventoryReturn(db, {
      orderId,
      userId,
      actorUid: `rider:${token.slice(0, 8)}`,
      kind: "rto",
      disposition: "sellable",
      lines,
      note: body.reason?.trim() || "Undelivered by rider",
    });
  }
  await doc.ref.set(
    {
      status: "cancelled",
      shipmentStep: 0,
      undeliveredReason: body.reason?.trim() || "Undelivered",
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  await notifyDeliveryOps({
    event: "delivery_undelivered",
    orderId,
    customerName: parsed.customerName,
    customerPhone: parsed.customerPhone,
    riderName: parsed.riderName,
    riderPhone: parsed.riderPhone,
    note: body.reason?.trim() || "Undelivered",
  });
  return NextResponse.json({ ok: true, restocked: lines.length });
}
