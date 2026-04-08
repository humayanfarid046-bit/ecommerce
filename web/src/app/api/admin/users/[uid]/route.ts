import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import type { AdminUserRow } from "@/lib/admin-mock-data";
import {
  computeUserSegment,
  emptyAdminUserRow,
} from "@/lib/admin-user-server-row";
import { WALLET_DOC_ID } from "@/lib/firebase/collections";

type RouteCtx = { params: Promise<{ uid: string }> };

/**
 * Full customer profile for admin detail modal — wishlist, recently viewed, wallet,
 * and order totals from this user’s `orders` subcollection (aligned with list API).
 */
export async function GET(req: Request, ctx: RouteCtx) {
  const gate = await verifyModuleAccess(req, "users");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const auth = getAdminAuth();
  const db = getAdminFirestore();
  if (!auth || !db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }

  const { uid } = await ctx.params;
  if (!uid?.trim()) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  let rec;
  try {
    rec = await auth.getUser(uid);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const base = emptyAdminUserRow(rec.uid, rec.email ?? "");
  const prof = await db.doc(`users/${uid}/profile/account`).get();
  const d = prof.data() as Record<string, unknown> | undefined;
  const displayName =
    typeof d?.displayName === "string" && d.displayName.trim()
      ? d.displayName.trim()
      : rec.displayName || base.name;
  const phone =
    typeof d?.phone === "string" ? d.phone.replace(/\D/g, "") : "";

  const ordersSnap = await db.collection(`users/${uid}/orders`).get();
  let orderCount = 0;
  let totalSpent = 0;
  for (const doc of ordersSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    orderCount += 1;
    totalSpent += Math.max(0, Number(data.totalRupees) || 0);
  }

  let walletBalance = 0;
  try {
    const wSnap = await db.doc(`users/${uid}/wallet/${WALLET_DOC_ID}`).get();
    const bp = Math.max(0, Number(wSnap.data()?.balancePaise) || 0);
    walletBalance = Math.round(bp / 100);
  } catch {
    /* ignore */
  }

  const wishSnap = await db.doc(`users/${uid}/profile/wishlist`).get();
  const wishIds = (wishSnap.data()?.productIds as string[]) ?? [];
  const wishlistItems = wishIds.slice(0, 12);

  const recentSnap = await db.doc(`users/${uid}/profile/recentlyViewed`).get();
  const recentIds = (recentSnap.data()?.productIds as string[]) ?? [];
  const lastSearches = recentIds.slice(0, 8);

  const lastSignInMs = rec.metadata.lastSignInTime
    ? new Date(rec.metadata.lastSignInTime).getTime()
    : null;

  const referredByUserId =
    typeof d?.referredByUserId === "string" && d.referredByUserId.trim()
      ? d.referredByUserId.trim()
      : typeof d?.referredBy === "string" && d.referredBy.trim()
        ? d.referredBy.trim()
        : null;
  const referralInvites = Math.max(
    0,
    Math.floor(Number(d?.referralInvites ?? d?.referralsCount ?? 0) || 0)
  );

  const user: AdminUserRow = {
    ...base,
    name: displayName,
    email: rec.email ?? base.email,
    phone: phone || base.phone,
    orders: orderCount,
    totalSpent,
    walletBalance,
    wishlistItems,
    lastSearches,
    referralInvites,
    referredByUserId,
    lastLogin: rec.metadata.lastSignInTime
      ? new Date(rec.metadata.lastSignInTime).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    lastActive: rec.metadata.lastSignInTime
      ? new Date(rec.metadata.lastSignInTime).toLocaleDateString("en-IN")
      : "—",
    segment: computeUserSegment({
      orderCount,
      lastSignInMs,
    }),
  };

  return NextResponse.json({ user });
}
