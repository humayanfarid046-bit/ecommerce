import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";

/** Today’s order count + revenue from Firestore (Admin SDK). */
export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "dashboard");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      {
        error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server.",
        ordersToday: 0,
        revenueToday: 0,
        totalOrders: 0,
      },
      { status: 503 }
    );
  }

  let snap;
  try {
    snap = await db.collectionGroup("orders").limit(2500).get();
  } catch {
    return NextResponse.json({
      ordersToday: 0,
      revenueToday: 0,
      totalOrders: 0,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  let ordersToday = 0;
  let revenueToday = 0;
  let totalOrders = 0;

  for (const doc of snap.docs) {
    totalOrders += 1;
    const data = doc.data() as Record<string, unknown>;
    const placed = typeof data.placedAt === "string" ? data.placedAt : "";
    if (placed.startsWith(today)) {
      ordersToday += 1;
      revenueToday += Math.max(0, Number(data.totalRupees) || 0);
    }
  }

  return NextResponse.json({
    ordersToday,
    revenueToday,
    totalOrders,
  });
}
