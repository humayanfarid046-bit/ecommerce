import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import type { InventoryMovementType, InventoryVariant } from "@/lib/inventory-model";

type Line = { variantId: string; productId: string; qty: number };

const VARIANTS = "inventoryVariants";
const MOVEMENTS = "inventoryMovements";
const RESERVATIONS = "inventoryReservations";
const POS = "purchaseOrders";
const TRANSFERS = "stockTransfers";
const ALERTS = "inventoryAlerts";
const SNAPSHOTS = "inventorySnapshots";

export function reservationExpiryMs(): number {
  return 15 * 60 * 1000;
}

function nowMs(): number {
  return Date.now();
}

function movementId(): string {
  return `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeQty(n: unknown): number {
  return Math.max(0, Math.floor(Number(n) || 0));
}

function lineKey(line: Line): string {
  return `${line.variantId}::${line.productId}`;
}

function normalizeLines(lines: Line[]): Line[] {
  const map = new Map<string, Line>();
  for (const raw of lines) {
    const qty = sanitizeQty(raw.qty);
    if (!raw.variantId || !raw.productId || qty <= 0) continue;
    const k = lineKey(raw);
    const prev = map.get(k);
    if (prev) map.set(k, { ...prev, qty: prev.qty + qty });
    else map.set(k, { variantId: raw.variantId, productId: raw.productId, qty });
  }
  return [...map.values()];
}

function toVariantSnapshot(
  id: string,
  data: FirebaseFirestore.DocumentData | undefined
): InventoryVariant {
  return {
    variantId: id,
    productId: String(data?.productId ?? ""),
    sku: String(data?.sku ?? id),
    title: String(data?.title ?? id),
    onHand: sanitizeQty(data?.onHand),
    quarantineQty: sanitizeQty(data?.quarantineQty),
    reserved: sanitizeQty(data?.reserved),
    reorderLevel: sanitizeQty(data?.reorderLevel),
    reorderQty: sanitizeQty(data?.reorderQty),
    warehouseId: String(data?.warehouseId ?? "main"),
    binId: typeof data?.binId === "string" ? data.binId : undefined,
    avgCostRupees:
      typeof data?.avgCostRupees === "number" ? Math.max(0, data.avgCostRupees) : undefined,
    updatedAt: typeof data?.updatedAt === "number" ? data.updatedAt : 0,
  };
}

function makeMovement(
  line: Line,
  type: InventoryMovementType,
  refType: "order" | "manual" | "po" | "transfer",
  refId: string,
  actorUid: string,
  note?: string
): FirebaseFirestore.DocumentData {
  return {
    movementId: movementId(),
    variantId: line.variantId,
    productId: line.productId,
    type,
    qty: line.qty,
    refType,
    refId,
    actorUid,
    note: note ?? null,
    at: nowMs(),
  };
}

function ensureAvailable(tx: Transaction, db: Firestore, line: Line) {
  return tx.get(db.collection(VARIANTS).doc(line.variantId)).then((snap) => {
    if (!snap.exists) {
      throw new Error(`Inventory not found for variant ${line.variantId}`);
    }
    const v = toVariantSnapshot(snap.id, snap.data());
    const available = Math.max(0, v.onHand - v.reserved);
    if (available < line.qty) {
      throw new Error(`Insufficient stock for ${v.title || line.variantId}`);
    }
  });
}

export async function getInventoryOverview(db: Firestore): Promise<InventoryVariant[]> {
  const snap = await db.collection(VARIANTS).orderBy("updatedAt", "desc").limit(400).get();
  return snap.docs.map((d) => toVariantSnapshot(d.id, d.data()));
}

export async function getRecentMovements(
  db: Firestore,
  opts?: { sinceMs?: number; limit?: number }
): Promise<
  {
    movementId: string;
    variantId: string;
    productId: string;
    type: InventoryMovementType;
    qty: number;
    refType?: string;
    refId?: string;
    actorUid?: string;
    note?: string;
    at: number;
  }[]
> {
  const limit = Math.max(1, Math.min(1000, Number(opts?.limit ?? 600)));
  let q: FirebaseFirestore.Query = db.collection(MOVEMENTS).orderBy("at", "desc").limit(limit);
  if (typeof opts?.sinceMs === "number" && Number.isFinite(opts.sinceMs)) {
    q = q.where("at", ">=", opts.sinceMs);
  }
  const snap = await q.get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      movementId: String(x.movementId ?? d.id),
      variantId: String(x.variantId ?? ""),
      productId: String(x.productId ?? ""),
      type: String(x.type ?? "adjust_in") as InventoryMovementType,
      qty: sanitizeQty(x.qty),
      refType: typeof x.refType === "string" ? x.refType : undefined,
      refId: typeof x.refId === "string" ? x.refId : undefined,
      actorUid: typeof x.actorUid === "string" ? x.actorUid : undefined,
      note: typeof x.note === "string" ? x.note : undefined,
      at: typeof x.at === "number" ? x.at : 0,
    };
  });
}

export async function getLowStockAlerts(
  db: Firestore,
  limit = 200
): Promise<
  {
    alertId: string;
    variantId: string;
    title: string;
    available: number;
    reorderLevel: number;
    severity: "warning" | "critical" | "out";
    status: "open" | "resolved";
    updatedAt: number;
  }[]
> {
  const snap = await db.collection(ALERTS).orderBy("updatedAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      alertId: d.id,
      variantId: String(x.variantId ?? ""),
      title: String(x.title ?? x.variantId ?? ""),
      available: sanitizeQty(x.available),
      reorderLevel: sanitizeQty(x.reorderLevel),
      severity:
        x.severity === "out" || x.severity === "critical" || x.severity === "warning"
          ? x.severity
          : "warning",
      status: x.status === "resolved" ? "resolved" : "open",
      updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : 0,
    };
  });
}

function alertSeverity(available: number, reorderLevel: number): "warning" | "critical" | "out" {
  if (available <= 0) return "out";
  if (available <= Math.max(1, Math.floor(reorderLevel / 2))) return "critical";
  return "warning";
}

export async function refreshLowStockAlerts(
  db: Firestore,
  opts?: { notifyWebhook?: boolean }
): Promise<{ openAlerts: number; changed: number }> {
  const rows = await getInventoryOverview(db);
  const lowRows = rows.filter((r) => Math.max(0, r.onHand - r.reserved) <= r.reorderLevel);
  const now = nowMs();
  let changed = 0;
  for (const r of lowRows) {
    const available = Math.max(0, r.onHand - r.reserved);
    const severity = alertSeverity(available, r.reorderLevel);
    const id = `low_${r.variantId}`;
    const ref = db.collection(ALERTS).doc(id);
    const prev = await ref.get();
    const prevData = prev.data();
    if (
      !prev.exists ||
      prevData?.available !== available ||
      prevData?.reorderLevel !== r.reorderLevel ||
      prevData?.severity !== severity ||
      prevData?.status !== "open"
    ) {
      changed += 1;
    }
    await ref.set(
      {
        alertId: id,
        kind: "low_stock",
        variantId: r.variantId,
        title: r.title,
        available,
        reorderLevel: r.reorderLevel,
        severity,
        status: "open",
        updatedAt: now,
      },
      { merge: true }
    );
  }
  const allOpen = await db
    .collection(ALERTS)
    .where("kind", "==", "low_stock")
    .where("status", "==", "open")
    .get();
  for (const d of allOpen.docs) {
    const v = String(d.data().variantId ?? "");
    if (!lowRows.some((r) => r.variantId === v)) {
      await d.ref.set({ status: "resolved", updatedAt: now }, { merge: true });
      changed += 1;
    }
  }
  if (opts?.notifyWebhook && changed > 0) {
    const webhook = process.env.INVENTORY_ALERT_WEBHOOK_URL?.trim();
    if (webhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "low_stock_alerts",
            changed,
            openAlerts: lowRows.length,
            at: new Date(now).toISOString(),
          }),
        });
      } catch {
        /* webhook is optional */
      }
    }
  }
  return { openAlerts: lowRows.length, changed };
}

export async function createDailyInventorySnapshot(
  db: Firestore,
  payload: { actorUid: string; note?: string }
): Promise<{ snapshotId: string }> {
  const rows = await getInventoryOverview(db);
  const analytics = await inventoryAnalytics(db);
  const now = new Date();
  const snapshotId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  await db.collection(SNAPSHOTS).doc(snapshotId).set(
    {
      snapshotId,
      date: snapshotId,
      totals: analytics,
      rows: rows.map((r) => ({
        variantId: r.variantId,
        title: r.title,
        onHand: r.onHand,
        reserved: r.reserved,
        quarantineQty: Math.max(0, Number(r.quarantineQty ?? 0)),
        reorderLevel: r.reorderLevel,
      })),
      actorUid: payload.actorUid,
      note: payload.note ?? null,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  return { snapshotId };
}

export async function getSnapshotHistory(
  db: Firestore,
  limit = 45
): Promise<
  {
    snapshotId: string;
    date: string;
    totals: {
      variants: number;
      lowStock: number;
      totalOnHand: number;
      reserved: number;
      quarantine: number;
    };
    updatedAt: number;
  }[]
> {
  const snap = await db.collection(SNAPSHOTS).orderBy("updatedAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    const t = x.totals as Record<string, unknown> | undefined;
    return {
      snapshotId: String(x.snapshotId ?? d.id),
      date: String(x.date ?? d.id),
      totals: {
        variants: sanitizeQty(t?.variants),
        lowStock: sanitizeQty(t?.lowStock),
        totalOnHand: sanitizeQty(t?.totalOnHand),
        reserved: sanitizeQty(t?.reserved),
        quarantine: sanitizeQty(t?.quarantine),
      },
      updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : 0,
    };
  });
}

export async function createPurchaseOrder(
  db: Firestore,
  payload: {
    actorUid: string;
    lines: { variantId: string; productId: string; qty: number; costRupees: number }[];
  }
): Promise<{ poId: string }> {
  const lines = payload.lines.filter((l) => l.variantId && l.productId && sanitizeQty(l.qty) > 0);
  if (lines.length === 0) throw new Error("Invalid PO payload");
  const poId = `po_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  await db.collection(POS).doc(poId).set({
    poId,
    source: "admin",
    status: "ordered",
    lines: lines.map((l) => ({
      variantId: l.variantId,
      productId: l.productId,
      qty: sanitizeQty(l.qty),
      costRupees: Math.max(0, Number(l.costRupees) || 0),
    })),
    createdAt: nowMs(),
    updatedAt: nowMs(),
    actorUid: payload.actorUid,
  });
  return { poId };
}

export async function receivePurchaseOrder(
  db: Firestore,
  payload: { poId: string; actorUid: string }
): Promise<void> {
  const poRef = db.collection(POS).doc(payload.poId);
  await db.runTransaction(async (tx) => {
    const poSnap = await tx.get(poRef);
    if (!poSnap.exists) throw new Error("PO not found");
    const po = poSnap.data() as { lines?: Line[]; status?: string };
    const lines = normalizeLines(Array.isArray(po.lines) ? po.lines : []);
    if (lines.length === 0) throw new Error("PO has no lines");
    for (const line of lines) {
      const ref = db.collection(VARIANTS).doc(line.variantId);
      tx.set(
        ref,
        {
          variantId: line.variantId,
          productId: line.productId,
          onHand: FieldValue.increment(line.qty),
          updatedAt: nowMs(),
        },
        { merge: true }
      );
      const movement = makeMovement(line, "receive", "po", payload.poId, payload.actorUid);
      tx.set(db.collection(MOVEMENTS).doc(movement.movementId), movement);
    }
    tx.set(poRef, { status: "received", updatedAt: nowMs() }, { merge: true });
  });
}

export async function createTransfer(
  db: Firestore,
  payload: {
    fromWarehouseId: string;
    toWarehouseId: string;
    actorUid: string;
    lines: Line[];
  }
): Promise<{ transferId: string }> {
  const lines = normalizeLines(payload.lines);
  if (!payload.fromWarehouseId || !payload.toWarehouseId || lines.length === 0) {
    throw new Error("Invalid transfer payload");
  }
  const transferId = `tr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  await db.runTransaction(async (tx) => {
    for (const line of lines) {
      await ensureAvailable(tx, db, line);
    }
    for (const line of lines) {
      const ref = db.collection(VARIANTS).doc(line.variantId);
      tx.set(
        ref,
        {
          onHand: FieldValue.increment(-line.qty),
          updatedAt: nowMs(),
          warehouseId: payload.fromWarehouseId,
        },
        { merge: true }
      );
      const mov = makeMovement(line, "transfer_out", "transfer", transferId, payload.actorUid);
      tx.set(db.collection(MOVEMENTS).doc(mov.movementId), mov);
    }
    tx.set(db.collection(TRANSFERS).doc(transferId), {
      transferId,
      status: "in_transit",
      fromWarehouseId: payload.fromWarehouseId,
      toWarehouseId: payload.toWarehouseId,
      lines,
      createdAt: nowMs(),
      updatedAt: nowMs(),
      actorUid: payload.actorUid,
    });
  });
  return { transferId };
}

export async function receiveTransfer(
  db: Firestore,
  payload: { transferId: string; actorUid: string }
): Promise<void> {
  const trRef = db.collection(TRANSFERS).doc(payload.transferId);
  await db.runTransaction(async (tx) => {
    const trSnap = await tx.get(trRef);
    if (!trSnap.exists) throw new Error("Transfer not found");
    const tr = trSnap.data() as {
      lines?: Line[];
      toWarehouseId?: string;
      status?: string;
    };
    const lines = normalizeLines(Array.isArray(tr.lines) ? tr.lines : []);
    if (lines.length === 0) throw new Error("Transfer has no lines");
    for (const line of lines) {
      const ref = db.collection(VARIANTS).doc(line.variantId);
      tx.set(
        ref,
        {
          onHand: FieldValue.increment(line.qty),
          updatedAt: nowMs(),
          warehouseId: String(tr.toWarehouseId ?? "main"),
        },
        { merge: true }
      );
      const mov = makeMovement(line, "transfer_in", "transfer", payload.transferId, payload.actorUid);
      tx.set(db.collection(MOVEMENTS).doc(mov.movementId), mov);
    }
    tx.set(trRef, { status: "received", updatedAt: nowMs() }, { merge: true });
  });
}

export async function inventoryAnalytics(db: Firestore): Promise<{
  variants: number;
  lowStock: number;
  totalOnHand: number;
  reserved: number;
  quarantine: number;
}> {
  const rows = await getInventoryOverview(db);
  let lowStock = 0;
  let totalOnHand = 0;
  let reserved = 0;
  let quarantine = 0;
  for (const r of rows) {
    totalOnHand += r.onHand;
    reserved += r.reserved;
    quarantine += Math.max(0, Number(r.quarantineQty ?? 0));
    if (Math.max(0, r.onHand - r.reserved) <= r.reorderLevel) lowStock += 1;
  }
  return { variants: rows.length, lowStock, totalOnHand, reserved, quarantine };
}

export async function releaseExpiredReservations(
  db: Firestore,
  actorUid: string
): Promise<{ releasedReservations: number }> {
  const now = nowMs();
  const snap = await db
    .collection(RESERVATIONS)
    .where("status", "==", "active")
    .where("expiresAt", "<=", now)
    .limit(80)
    .get();
  let releasedReservations = 0;
  for (const d of snap.docs) {
    const x = d.data() as { lines?: Line[] };
    const lines = normalizeLines(Array.isArray(x.lines) ? x.lines : []);
    await db.runTransaction(async (tx) => {
      for (const line of lines) {
        tx.set(
          db.collection(VARIANTS).doc(line.variantId),
          {
            reserved: FieldValue.increment(-line.qty),
            updatedAt: nowMs(),
          },
          { merge: true }
        );
        const mov = makeMovement(line, "release", "order", d.id, actorUid, "expired reservation release");
        tx.set(db.collection(MOVEMENTS).doc(mov.movementId), mov);
      }
      tx.set(d.ref, { status: "expired", updatedAt: nowMs() }, { merge: true });
    });
    releasedReservations += 1;
  }
  return { releasedReservations };
}

export async function adjustInventory(
  db: Firestore,
  payload: {
    variantId: string;
    productId: string;
    sku: string;
    title: string;
    qty: number;
    direction: "in" | "out";
    actorUid: string;
    note?: string;
  }
): Promise<void> {
  const qty = sanitizeQty(payload.qty);
  if (!payload.variantId || !payload.productId || qty <= 0) {
    throw new Error("Invalid inventory adjustment payload");
  }
  const ref = db.collection(VARIANTS).doc(payload.variantId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = toVariantSnapshot(payload.variantId, snap.data());
    const nextOnHand = payload.direction === "in" ? cur.onHand + qty : cur.onHand - qty;
    if (nextOnHand < cur.reserved) {
      throw new Error("Cannot reduce below reserved stock");
    }
    tx.set(
      ref,
      {
        variantId: payload.variantId,
        productId: payload.productId,
        sku: payload.sku || payload.variantId,
        title: payload.title || payload.variantId,
        onHand: nextOnHand,
        reserved: cur.reserved,
        reorderLevel: cur.reorderLevel || 5,
        reorderQty: cur.reorderQty || 20,
        warehouseId: cur.warehouseId || "main",
        updatedAt: nowMs(),
      },
      { merge: true }
    );
    const line: Line = {
      variantId: payload.variantId,
      productId: payload.productId,
      qty,
    };
    const movement = makeMovement(
      line,
      payload.direction === "in" ? "adjust_in" : "adjust_out",
      "manual",
      payload.variantId,
      payload.actorUid,
      payload.note
    );
    tx.set(db.collection(MOVEMENTS).doc(movement.movementId), movement);
  });
}

export async function commitOrderInventory(
  db: Firestore,
  payload: {
    orderId: string;
    userId: string;
    actorUid: string;
    lines: Line[];
  }
): Promise<{ committed: number }> {
  const lines = normalizeLines(payload.lines);
  if (!payload.orderId || !payload.userId || lines.length === 0) {
    throw new Error("Invalid inventory commit payload");
  }
  const reservationId = `res_${payload.orderId}`;
  await db.runTransaction(async (tx) => {
    for (const line of lines) {
      await ensureAvailable(tx, db, line);
    }
    for (const line of lines) {
      const ref = db.collection(VARIANTS).doc(line.variantId);
      tx.set(
        ref,
        {
          variantId: line.variantId,
          productId: line.productId,
          onHand: FieldValue.increment(-line.qty),
          updatedAt: nowMs(),
        },
        { merge: true }
      );
      const movement = makeMovement(line, "commit", "order", payload.orderId, payload.actorUid);
      tx.set(db.collection(MOVEMENTS).doc(movement.movementId), movement);
    }
    tx.set(
      db.collection(RESERVATIONS).doc(reservationId),
      {
        reservationId,
        orderId: payload.orderId,
        userId: payload.userId,
        status: "committed",
        lines,
        expiresAt: nowMs() + reservationExpiryMs(),
        createdAt: nowMs(),
        updatedAt: nowMs(),
      },
      { merge: true }
    );
  });
  return { committed: lines.length };
}

export async function processInventoryReturn(
  db: Firestore,
  payload: {
    orderId: string;
    userId: string;
    actorUid: string;
    kind: "return" | "rto";
    disposition?: "sellable" | "damaged";
    lines: Line[];
    note?: string;
  }
): Promise<{ received: number }> {
  const lines = normalizeLines(payload.lines);
  if (!payload.orderId || !payload.userId || lines.length === 0) {
    throw new Error("Invalid return payload");
  }
  await db.runTransaction(async (tx) => {
    for (const line of lines) {
      const ref = db.collection(VARIANTS).doc(line.variantId);
      tx.set(
        ref,
        {
          variantId: line.variantId,
          productId: line.productId,
          onHand:
            payload.disposition === "damaged"
              ? FieldValue.increment(0)
              : FieldValue.increment(line.qty),
          quarantineQty:
            payload.disposition === "damaged"
              ? FieldValue.increment(line.qty)
              : FieldValue.increment(0),
          updatedAt: nowMs(),
        },
        { merge: true }
      );
      const movement = makeMovement(
        line,
        payload.kind === "rto" ? "rto_receive" : "return_receive",
        "order",
        payload.orderId,
        payload.actorUid,
        payload.note ?? (payload.kind === "rto" ? "rto received" : "customer return received")
      );
      tx.set(db.collection(MOVEMENTS).doc(movement.movementId), movement);
    }
  });
  return { received: lines.length };
}
