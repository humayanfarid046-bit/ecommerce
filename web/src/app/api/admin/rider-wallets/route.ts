import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import { normalizeAppRole } from "@/lib/rbac";
import { settleRiderCash } from "@/lib/server-rider-wallet";

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "orders");
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
  const users = await auth.listUsers(1000);
  const partners: Array<{ uid: string; name: string; disabled: boolean }> = [];
  for (const u of users.users) {
    const snap = await db.doc(`users/${u.uid}/profile/account`).get();
    const d = (snap.data() ?? {}) as Record<string, unknown>;
    if (normalizeAppRole(d.role) !== "DELIVERY_PARTNER") continue;
    partners.push({
      uid: u.uid,
      name:
        (typeof d.displayName === "string" && d.displayName.trim()) ||
        u.displayName ||
        "Delivery Partner",
      disabled: Boolean(u.disabled),
    });
  }
  let totalCashPaise = 0;
  let totalOnlineLifetimePaise = 0;
  const wallets = await Promise.all(
    partners.map(async (p) => {
      const w = await db.doc(`riderWallets/${p.uid}`).get();
      const data = (w.data() ?? {}) as Record<string, unknown>;
      const cashPaise = Math.max(0, Math.floor(Number(data.cashInHandPaise) || 0));
      const onlinePaise = Math.max(0, Math.floor(Number(data.lifetimeOnlineReportedPaise) || 0));
      totalCashPaise += cashPaise;
      totalOnlineLifetimePaise += onlinePaise;
      return {
        uid: p.uid,
        name: p.name,
        disabled: p.disabled,
        cashInHandRupees: cashPaise / 100,
        onlineReportedLifetimeRupees: onlinePaise / 100,
        lastSettledAt:
          typeof data.lastSettledAt === "number" ? data.lastSettledAt : null,
      };
    })
  );
  return NextResponse.json({
    wallets,
    totals: {
      cashWithRidersRupees: totalCashPaise / 100,
      onlineLifetimeReportedRupees: totalOnlineLifetimePaise / 100,
    },
  });
}

export async function POST(req: Request) {
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
  const body = (await req.json().catch(() => ({}))) as {
    riderUid?: string;
    action?: "settle";
  };
  const riderUid = String(body.riderUid ?? "").trim();
  if (!riderUid || body.action !== "settle") {
    return NextResponse.json({ error: "riderUid and action settle required" }, { status: 400 });
  }
  const { settledCashPaise } = await settleRiderCash(db, riderUid, gate.uid);
  return NextResponse.json({
    ok: true,
    settledCashRupees: settledCashPaise / 100,
  });
}
