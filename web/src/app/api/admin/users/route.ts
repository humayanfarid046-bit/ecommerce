import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import type { AdminUserRow, UserSegment } from "@/lib/admin-mock-data";

function defaultSegment(): UserSegment {
  return "new";
}

function emptyRow(uid: string, email: string): AdminUserRow {
  return {
    id: uid,
    name: "—",
    email: email || "—",
    phone: "",
    orders: 0,
    blocked: false,
    lastActive: "—",
    totalSpent: 0,
    segment: defaultSegment(),
    lastLogin: "—",
    wishlistItems: [],
    lastSearches: [],
    walletBalance: 0,
    referralInvites: 0,
    verified: true,
    suspicious: false,
    shadowBanned: false,
    fraudFlags: { highCancels: false, otpFails: false },
    codRefusedCount: 0,
  };
}

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "users");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const auth = getAdminAuth();
  const db = getAdminFirestore();
  if (!auth || !db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server.", users: [] },
      { status: 503 }
    );
  }

  const orderSnap = await db.collectionGroup("orders").limit(3000).get();
  const spendByUser = new Map<string, { count: number; spent: number }>();
  for (const doc of orderSnap.docs) {
    const parts = doc.ref.path.split("/");
    if (parts[0] !== "users" || parts.length < 2) continue;
    const uid = parts[1]!;
    const data = doc.data() as Record<string, unknown>;
    const amt = Math.max(0, Number(data.totalRupees) || 0);
    const cur = spendByUser.get(uid) ?? { count: 0, spent: 0 };
    cur.count += 1;
    cur.spent += amt;
    spendByUser.set(uid, cur);
  }

  const list = await auth.listUsers(1000);
  const users: AdminUserRow[] = [];

  for (const u of list.users) {
    const base = emptyRow(u.uid, u.email ?? "");
    const prof = await db.doc(`users/${u.uid}/profile/account`).get();
    const d = prof.data() as Record<string, unknown> | undefined;
    const displayName =
      typeof d?.displayName === "string" && d.displayName.trim()
        ? d.displayName.trim()
        : u.displayName || base.name;
    const phone =
      typeof d?.phone === "string" ? d.phone.replace(/\D/g, "") : "";
    const agg = spendByUser.get(u.uid);
    users.push({
      ...base,
      name: displayName,
      email: u.email ?? base.email,
      phone: phone || base.phone,
      orders: agg?.count ?? 0,
      totalSpent: agg?.spent ?? 0,
      lastLogin: u.metadata.lastSignInTime
        ? new Date(u.metadata.lastSignInTime).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      lastActive: u.metadata.lastSignInTime
        ? new Date(u.metadata.lastSignInTime).toLocaleDateString("en-IN")
        : "—",
      segment: (agg?.count ?? 0) > 3 ? "premium" : defaultSegment(),
    });
  }

  users.sort((a, b) => b.totalSpent - a.totalSpent);

  return NextResponse.json({ users });
}
