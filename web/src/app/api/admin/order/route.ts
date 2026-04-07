import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { UserOrderRecord } from "@/lib/user-order-firestore";
import { verifyModuleAccess } from "@/lib/server-access";

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

  await db.doc(`users/${userId.trim()}/orders/${orderId.trim()}`).set(patch, {
    merge: true,
  });
  return NextResponse.json({ ok: true });
}
