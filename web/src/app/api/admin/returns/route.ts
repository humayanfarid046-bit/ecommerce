import { NextResponse } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import type { AdminReturnReq } from "@/lib/admin-types";

function tsMs(v: unknown): number {
  if (typeof v === "number") return v;
  if (
    v &&
    typeof v === "object" &&
    "toMillis" in v &&
    typeof (v as Timestamp).toMillis === "function"
  ) {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

function toRow(
  userId: string,
  returnId: string,
  data: Record<string, unknown>
): AdminReturnReq {
  return {
    id: returnId,
    userId,
    orderId: typeof data.orderId === "string" ? data.orderId : "",
    reason: typeof data.reason === "string" ? data.reason : "Return request",
    status:
      data.status === "approved" || data.status === "rejected"
        ? data.status
        : "pending",
    imageProofUrl:
      typeof data.imageProofUrl === "string" ? data.imageProofUrl : undefined,
    pickupDate: typeof data.pickupDate === "string" ? data.pickupDate : undefined,
    refundMethod:
      data.refundMethod === "wallet" || data.refundMethod === "bank"
        ? data.refundMethod
        : null,
    processedAt:
      typeof data.processedAt === "string" ? data.processedAt : undefined,
    adminNote: typeof data.adminNote === "string" ? data.adminNote : undefined,
  };
}

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "orders");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ returns: [] }, { status: 503 });
  }

  let snap;
  try {
    snap = await db
      .collectionGroup("returns")
      .orderBy("createdAt", "desc")
      .limit(300)
      .get();
  } catch {
    snap = await db.collectionGroup("returns").limit(300).get();
  }

  const docs = snap.docs.slice();
  docs.sort(
    (a, b) =>
      tsMs(b.data().createdAt) -
      tsMs(a.data().createdAt)
  );

  const rows: AdminReturnReq[] = [];
  for (const d of docs) {
    const p = d.ref.path.split("/");
    if (p.length < 4 || p[0] !== "users" || p[2] !== "returns") continue;
    rows.push(toRow(p[1]!, d.id, d.data() as Record<string, unknown>));
  }
  return NextResponse.json({ returns: rows });
}

export async function PATCH(req: Request) {
  const gate = await verifyModuleAccess(req, "orders");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 503 });
  }
  const body = (await req.json()) as {
    userId?: string;
    returnId?: string;
    orderId?: string;
    status?: "pending" | "approved" | "rejected";
    refundMethod?: "wallet" | "bank" | null;
    pickupDate?: string;
    adminNote?: string;
  };
  const userId = body.userId?.trim();
  const returnId = body.returnId?.trim();
  if (!userId || !returnId) {
    return NextResponse.json({ error: "userId and returnId are required" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  if (body.status) patch.status = body.status;
  if (body.refundMethod !== undefined) patch.refundMethod = body.refundMethod;
  if (body.pickupDate !== undefined) patch.pickupDate = body.pickupDate;
  if (body.adminNote !== undefined) patch.adminNote = body.adminNote;
  if (body.status === "approved" || body.status === "rejected") {
    patch.processedAt = new Date().toISOString();
  }
  await db.doc(`users/${userId}/returns/${returnId}`).set(patch, { merge: true });

  const orderId = body.orderId?.trim();
  if (orderId && body.status) {
    await db.doc(`users/${userId}/orders/${orderId}`).set(
      {
        returnStatus: body.status,
        returnRefundMethod: body.refundMethod ?? null,
        returnUpdatedAt: Date.now(),
      },
      { merge: true }
    );
  }
  return NextResponse.json({ ok: true });
}
