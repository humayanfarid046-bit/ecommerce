import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import {
  adjustInventory,
  createDailyInventorySnapshot,
  createPurchaseOrder,
  createTransfer,
  getInventoryOverview,
  getLowStockAlerts,
  getRecentMovements,
  getSnapshotHistory,
  inventoryAnalytics,
  refreshLowStockAlerts,
  releaseExpiredReservations,
  receivePurchaseOrder,
  receiveTransfer,
} from "@/lib/server-inventory";

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "inventory");
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
  const now = Date.now();
  const dayStart = new Date(new Date(now).toDateString()).getTime();
  // Auto ops maintenance on dashboard/inventory open: refresh low-stock flags and keep one daily snapshot updated.
  await Promise.all([
    refreshLowStockAlerts(db, { notifyWebhook: false }),
    createDailyInventorySnapshot(db, { actorUid: gate.uid, note: "auto-daily-refresh" }),
  ]);
  const [rows, analytics, movements, alerts, snapshots] = await Promise.all([
    getInventoryOverview(db),
    inventoryAnalytics(db),
    getRecentMovements(db, { sinceMs: dayStart, limit: 1000 }),
    getLowStockAlerts(db),
    getSnapshotHistory(db, 45),
  ]);
  return NextResponse.json({ rows, analytics, movements, alerts, snapshots });
}

export async function POST(req: Request) {
  const gate = await verifyModuleAccess(req, "inventory");
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as {
    action?: string;
    variantId?: string;
    productId?: string;
    sku?: string;
    title?: string;
    qty?: number;
    direction?: "in" | "out";
    note?: string;
    poId?: string;
    lines?: {
      variantId?: string;
      productId?: string;
      qty?: number;
      costRupees?: number;
    }[];
    fromWarehouseId?: string;
    toWarehouseId?: string;
    notifyWebhook?: boolean;
  };
  try {
    if (b.action === "adjust") {
      await adjustInventory(db, {
        variantId: String(b.variantId ?? "").trim(),
        productId: String(b.productId ?? "").trim(),
        sku: String(b.sku ?? "").trim(),
        title: String(b.title ?? "").trim(),
        qty: Number(b.qty ?? 0),
        direction: b.direction === "out" ? "out" : "in",
        actorUid: gate.uid,
        note: typeof b.note === "string" ? b.note.trim() : undefined,
      });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "po_create") {
      const out = await createPurchaseOrder(db, {
        actorUid: gate.uid,
        lines: Array.isArray(b.lines)
          ? b.lines.map((x) => ({
              variantId: String(x.variantId ?? "").trim(),
              productId: String(x.productId ?? "").trim(),
              qty: Number(x.qty ?? 0),
              costRupees: Number(x.costRupees ?? 0),
            }))
          : [],
      });
      return NextResponse.json({ ok: true, ...out });
    }
    if (b.action === "po_receive") {
      await receivePurchaseOrder(db, {
        poId: String(b.poId ?? "").trim(),
        actorUid: gate.uid,
      });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "transfer_create") {
      const out = await createTransfer(db, {
        fromWarehouseId: String(b.fromWarehouseId ?? "").trim(),
        toWarehouseId: String(b.toWarehouseId ?? "").trim(),
        actorUid: gate.uid,
        lines: Array.isArray(b.lines)
          ? b.lines.map((x) => ({
              variantId: String(x.variantId ?? "").trim(),
              productId: String(x.productId ?? "").trim(),
              qty: Number(x.qty ?? 0),
            }))
          : [],
      });
      return NextResponse.json({ ok: true, ...out });
    }
    if (b.action === "transfer_receive") {
      await receiveTransfer(db, {
        transferId: String((body as { transferId?: string }).transferId ?? "").trim(),
        actorUid: gate.uid,
      });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "cleanup_expired") {
      const out = await releaseExpiredReservations(db, gate.uid);
      return NextResponse.json({ ok: true, ...out });
    }
    if (b.action === "alerts_refresh") {
      const out = await refreshLowStockAlerts(db, {
        notifyWebhook: b.notifyWebhook === true,
      });
      return NextResponse.json({ ok: true, ...out });
    }
    if (b.action === "snapshot_create") {
      const out = await createDailyInventorySnapshot(db, {
        actorUid: gate.uid,
        note: typeof b.note === "string" ? b.note.trim() : undefined,
      });
      return NextResponse.json({ ok: true, ...out });
    }
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Adjustment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
