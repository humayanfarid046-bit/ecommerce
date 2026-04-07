import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import { parseUserOrderDocument } from "@/lib/user-order-firestore";
import { userOrderToAdminRow } from "@/lib/admin-order-map";
import type { AdminOrderRow, AdminTransaction } from "@/lib/admin-mock-data";

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "orders");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      {
        error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server.",
        orders: [],
        transactions: [],
        summary: null,
      },
      { status: 503 }
    );
  }

  let snap;
  try {
    snap = await db
      .collectionGroup("orders")
      .orderBy("placedAt", "desc")
      .limit(400)
      .get();
  } catch {
    snap = await db.collectionGroup("orders").limit(500).get();
  }

  const rows: AdminOrderRow[] = [];
  const transactions: AdminTransaction[] = [];
  const today = new Date().toISOString().slice(0, 10);
  let ordersToday = 0;
  let revenueToday = 0;

  const docs = snap.docs.slice();
  docs.sort((a, b) => {
    const pa = String(a.data().placedAt ?? "");
    const pb = String(b.data().placedAt ?? "");
    return pb.localeCompare(pa);
  });

  for (const doc of docs) {
    const parts = doc.ref.path.split("/");
    if (parts.length < 4 || parts[0] !== "users" || parts[2] !== "orders") {
      continue;
    }
    const userId = parts[1]!;
    const data = doc.data() as Record<string, unknown>;
    const rec = parseUserOrderDocument(doc.id, data);
    const adminRow = userOrderToAdminRow(userId, rec);
    rows.push(adminRow);

    const placed = typeof data.placedAt === "string" ? data.placedAt : "";
    if (placed.startsWith(today)) {
      ordersToday += 1;
      revenueToday += Math.max(0, Number(data.totalRupees) || 0);
    }

    const txnId =
      typeof data.paymentTxnId === "string" ? data.paymentTxnId.trim() : "";
    if (txnId) {
      transactions.push({
        id: txnId,
        orderId: doc.id,
        method: typeof data.methodLabel === "string" ? data.methodLabel : "—",
        amount: Math.max(0, Number(data.totalRupees) || 0),
        status: "success",
        at: placed.slice(0, 19).replace("T", " ") || "—",
      });
    }
  }

  transactions.sort((a, b) => b.at.localeCompare(a.at));

  return NextResponse.json({
    orders: rows,
    transactions: transactions.slice(0, 200),
    summary: {
      ordersToday,
      revenueToday,
      totalOrders: rows.length,
    },
  });
}
