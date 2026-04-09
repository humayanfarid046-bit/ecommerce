import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import { normalizeAppRole } from "@/lib/rbac";
import { parseUserOrderDocument } from "@/lib/user-order-firestore";

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
  const today = new Date().toISOString().slice(0, 10);

  const users = await auth.listUsers(1000);
  const partnerMeta = new Map<
    string,
    { name: string; disabled: boolean; online: boolean; lastLat: number | null; lastLng: number | null }
  >();
  for (const u of users.users) {
    const snap = await db.doc(`users/${u.uid}/profile/account`).get();
    const d = (snap.data() ?? {}) as Record<string, unknown>;
    if (normalizeAppRole(d.role) !== "DELIVERY_PARTNER") continue;
    const del = await db.doc(`users/${u.uid}/profile/delivery`).get();
    const dd = (del.data() ?? {}) as Record<string, unknown>;
    const lastLat =
      typeof dd.lastLat === "number" && Number.isFinite(dd.lastLat) ? dd.lastLat : null;
    const lastLng =
      typeof dd.lastLng === "number" && Number.isFinite(dd.lastLng) ? dd.lastLng : null;
    partnerMeta.set(u.uid, {
      name:
        (typeof d.displayName === "string" && d.displayName.trim()) ||
        u.displayName ||
        "Delivery Partner",
      disabled: Boolean(u.disabled),
      online: Boolean(dd.online),
      lastLat,
      lastLng,
    });
  }

  let snap;
  try {
    snap = await db.collectionGroup("orders").where("status", "==", "out_for_delivery").limit(500).get();
  } catch {
    snap = await db.collectionGroup("orders").limit(500).get();
  }
  const outByPartner = new Map<string, number>();
  let pendingOutForDelivery = 0;
  let pendingTodayPlaced = 0;
  const docs = snap.docs.filter((d) => {
    const st = (d.data() as Record<string, unknown>).status;
    return st === "out_for_delivery";
  });
  for (const doc of docs) {
    const data = doc.data() as Record<string, unknown>;
    pendingOutForDelivery += 1;
    const placed = typeof data.placedAt === "string" ? data.placedAt : "";
    if (placed.startsWith(today)) pendingTodayPlaced += 1;
    const pid = typeof data.deliveryPartnerId === "string" ? data.deliveryPartnerId.trim() : "";
    if (pid) {
      outByPartner.set(pid, (outByPartner.get(pid) ?? 0) + 1);
    }
  }

  const deliveredTodayByPartner = new Map<string, number>();
  const deliveryMinutesSamples: number[] = [];
  const histSnap = await db.collectionGroup("orders").limit(800).get();
  for (const doc of histSnap.docs) {
    const raw = doc.data() as Record<string, unknown>;
    if (raw.status !== "delivered") continue;
    const rec = parseUserOrderDocument(doc.id, raw);
    const deliveredAt = rec.deliveredAt ?? "";
    if (!deliveredAt.startsWith(today)) continue;
    const pid = rec.deliveryPartnerId?.trim();
    if (pid) {
      deliveredTodayByPartner.set(pid, (deliveredTodayByPartner.get(pid) ?? 0) + 1);
    }
    const placedMs = Date.parse(rec.placedAt);
    const doneMs = Date.parse(deliveredAt);
    if (Number.isFinite(placedMs) && Number.isFinite(doneMs) && doneMs >= placedMs) {
      deliveryMinutesSamples.push((doneMs - placedMs) / 60000);
    }
  }

  let topPerformer: { partnerId: string; partnerName: string; deliveredToday: number } | null = null;
  for (const [pid, n] of deliveredTodayByPartner) {
    if (!topPerformer || n > topPerformer.deliveredToday) {
      topPerformer = {
        partnerId: pid,
        partnerName: partnerMeta.get(pid)?.name ?? "Rider",
        deliveredToday: n,
      };
    }
  }

  const avgDeliveryMinutes =
    deliveryMinutesSamples.length > 0
      ? deliveryMinutesSamples.reduce((a, b) => a + b, 0) / deliveryMinutesSamples.length
      : null;

  const live = [...partnerMeta.entries()].map(([uid, m]) => ({
    uid,
    name: m.name,
    disabled: m.disabled,
    dutyOnline: m.online,
    outForDeliveryCount: outByPartner.get(uid) ?? 0,
    lastLat: m.lastLat,
    lastLng: m.lastLng,
  }));

  return NextResponse.json({
    pendingOutForDelivery,
    pendingTodayPlacedOutForDelivery: pendingTodayPlaced,
    topPerformer,
    avgDeliveryMinutesToday: avgDeliveryMinutes,
    liveRiders: live.sort((a, b) => b.outForDeliveryCount - a.outForDeliveryCount),
  });
}
