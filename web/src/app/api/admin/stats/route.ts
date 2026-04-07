import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import { methodLabelToPaymentKey } from "@/lib/admin-order-map";
import { pinToRegionKey } from "@/lib/pin-region";
import type { PaymentMixRow, RegionOrderRow } from "@/lib/admin-stats-types";

/** Firestore-backed dashboard metrics (UTC calendar days match `placedAt` ISO). */
export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "dashboard");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  const auth = getAdminAuth();
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
    snap = await db.collectionGroup("orders").limit(5000).get();
  } catch {
    return NextResponse.json({
      ordersToday: 0,
      revenueToday: 0,
      ordersYesterday: 0,
      revenueYesterday: 0,
      totalOrders: 0,
      newUsersToday: 0,
      paymentMix: [] as PaymentMixRow[],
      regionOrders: [] as RegionOrderRow[],
      hourlyToday: [] as { name: string; revenue: number }[],
    });
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yday = new Date(today);
  yday.setUTCDate(yday.getUTCDate() - 1);
  const yesterdayStr = yday.toISOString().slice(0, 10);

  let ordersToday = 0;
  let revenueToday = 0;
  let ordersYesterday = 0;
  let revenueYesterday = 0;
  let totalOrders = 0;

  const payAmt: Record<"upi" | "cod" | "card" | "netbanking", number> = {
    upi: 0,
    cod: 0,
    card: 0,
    netbanking: 0,
  };
  const regionCount: Record<string, number> = {};
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    name: String(i).padStart(2, "0"),
    revenue: 0,
  }));

  for (const doc of snap.docs) {
    totalOrders += 1;
    const data = doc.data() as Record<string, unknown>;
    const placed = typeof data.placedAt === "string" ? data.placedAt : "";
    const amt = Math.max(0, Number(data.totalRupees) || 0);
    const method = typeof data.methodLabel === "string" ? data.methodLabel : "";
    const rk = pinToRegionKey(
      typeof data.deliveryPin === "string" ? data.deliveryPin : undefined
    );
    regionCount[rk] = (regionCount[rk] ?? 0) + 1;

    if (placed.startsWith(todayStr)) {
      ordersToday += 1;
      revenueToday += amt;
      const key = methodLabelToPaymentKey(method);
      payAmt[key] += amt;
      const h = new Date(placed).getUTCHours();
      if (h >= 0 && h < 24) hourly[h]!.revenue += amt;
    } else if (placed.startsWith(yesterdayStr)) {
      ordersYesterday += 1;
      revenueYesterday += amt;
    }
  }

  const payTotal = payAmt.upi + payAmt.cod + payAmt.card + payAmt.netbanking;
  const paymentMix: PaymentMixRow[] = (["upi", "cod", "card", "netbanking"] as const).map(
    (key) => ({
      key,
      amount: Math.round(payAmt[key]),
      percent:
        payTotal > 0 ? Math.round((payAmt[key] / payTotal) * 1000) / 10 : 0,
    })
  );

  const regionOrders: RegionOrderRow[] = Object.entries(regionCount).map(
    ([regionKey, orders]) => ({ regionKey, orders })
  );

  let newUsersToday = 0;
  if (auth) {
    try {
      const todayStart = new Date(todayStr + "T00:00:00.000Z");
      const list = await auth.listUsers(1000);
      for (const u of list.users) {
        const c = new Date(u.metadata.creationTime);
        if (c >= todayStart) newUsersToday += 1;
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    ordersToday,
    revenueToday,
    ordersYesterday,
    revenueYesterday,
    totalOrders,
    newUsersToday,
    paymentMix,
    regionOrders,
    hourlyToday: hourly,
  });
}
