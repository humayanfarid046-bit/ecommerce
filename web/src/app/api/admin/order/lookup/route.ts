import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";

/**
 * Resolve Firebase Auth UID for an order id via collection group query on `orders`
 * (documents at `users/{uid}/orders/{orderId}` with field `id` matching the order).
 */
export async function GET(req: Request) {
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
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "orderId query parameter is required" },
      { status: 400 }
    );
  }
  const snap = await db
    .collectionGroup("orders")
    .where("id", "==", orderId)
    .limit(1)
    .get();
  if (snap.empty) {
    return NextResponse.json({ found: false, userId: null });
  }
  const docSnap = snap.docs[0]!;
  const parts = docSnap.ref.path.split("/");
  const uix = parts.indexOf("users");
  const userId =
    uix >= 0 && parts[uix + 1] ? (parts[uix + 1] as string) : null;
  return NextResponse.json({ found: true, userId });
}
