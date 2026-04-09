import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type Firestore,
  type QuerySnapshot,
} from "firebase/firestore";
import type { OrderShipmentStep } from "@/lib/account-order-view";

export type UserOrderRecord = {
  id: string;
  placedAt: string;
  totalRupees: number;
  methodLabel: string;
  paymentTxnId?: string;
  itemCount: number;
  /** Business status — checkout writes `placed`. */
  status:
    | "placed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  /** 0–3 tracker (aligned with AccountOrder.step). */
  shipmentStep: OrderShipmentStep;
  itemTitle?: string;
  eta?: string;
  hubCity?: string;
  trackingId?: string;
  timelineNote?: string;
  updatedAt?: number;
  /** Snapshot at checkout for admin list (optional on older orders). */
  customerName?: string;
  customerPhone?: string;
  deliveryPin?: string;
  lineItems?: Array<{
    variantId: string;
    productId: string;
    qty: number;
  }>;
  riderName?: string;
  riderPhone?: string;
  riderToken?: string;
  deliveryOtp?: string;
  deliveryOtpVerifiedAt?: number;
  cashCollectedRupees?: number;
  deliveredAt?: string;
  undeliveredReason?: string;
  riderTokenExpiresAt?: number;
  riderTokenRevokedAt?: number;
  paymentStatus?: "PENDING" | "PAID";
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryAddress?: string;
  deliveredById?: string;
  deliveredByName?: string;
  paidAt?: string;
  /** Rider marked RTO; inventory not yet restocked until admin Stock In. */
  rtoPendingStockIn?: boolean;
  rtoMarkedAt?: number;
  rtoStockInAt?: number;
};

export function parseUserOrderDocument(
  id: string,
  x: Record<string, unknown>
): UserOrderRecord {
  const stepRaw = x.shipmentStep;
  let shipmentStep: OrderShipmentStep = 0;
  if (typeof stepRaw === "number" && stepRaw >= 0 && stepRaw <= 3) {
    shipmentStep = stepRaw as OrderShipmentStep;
  }
  const statusRaw = x.status;
  const status =
    typeof statusRaw === "string" &&
    [
      "placed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ].includes(statusRaw)
      ? (statusRaw as UserOrderRecord["status"])
      : "placed";

  const rtoPending =
    x.rtoPendingStockIn === true ||
    (typeof x.rtoPendingStockIn === "string" && x.rtoPendingStockIn === "true");

  return {
    id,
    placedAt: typeof x.placedAt === "string" ? x.placedAt : "",
    totalRupees: Math.max(0, Number(x.totalRupees) || 0),
    methodLabel: typeof x.methodLabel === "string" ? x.methodLabel : "",
    paymentTxnId:
      typeof x.paymentTxnId === "string" ? x.paymentTxnId : undefined,
    itemCount: Math.max(0, Math.floor(Number(x.itemCount) || 0)),
    status,
    shipmentStep,
    itemTitle: typeof x.itemTitle === "string" ? x.itemTitle : undefined,
    eta: typeof x.eta === "string" ? x.eta : undefined,
    hubCity: typeof x.hubCity === "string" ? x.hubCity : undefined,
    trackingId: typeof x.trackingId === "string" ? x.trackingId : undefined,
    timelineNote: typeof x.timelineNote === "string" ? x.timelineNote : undefined,
    updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : undefined,
    customerName:
      typeof x.customerName === "string" ? x.customerName : undefined,
    customerPhone:
      typeof x.customerPhone === "string" ? x.customerPhone : undefined,
    deliveryPin:
      typeof x.deliveryPin === "string" ? x.deliveryPin : undefined,
    lineItems: Array.isArray(x.lineItems)
      ? x.lineItems
          .map((it) => {
            const row = it as Record<string, unknown>;
            const variantId =
              typeof row.variantId === "string" ? row.variantId : "";
            const productId =
              typeof row.productId === "string" ? row.productId : variantId;
            const qty = Math.max(0, Math.floor(Number(row.qty) || 0));
            if (!variantId || !qty) return null;
            return { variantId, productId, qty };
          })
          .filter((it): it is { variantId: string; productId: string; qty: number } => Boolean(it))
      : undefined,
    riderName: typeof x.riderName === "string" ? x.riderName : undefined,
    riderPhone: typeof x.riderPhone === "string" ? x.riderPhone : undefined,
    riderToken: typeof x.riderToken === "string" ? x.riderToken : undefined,
    deliveryOtp: typeof x.deliveryOtp === "string" ? x.deliveryOtp : undefined,
    deliveryOtpVerifiedAt:
      typeof x.deliveryOtpVerifiedAt === "number"
        ? x.deliveryOtpVerifiedAt
        : undefined,
    cashCollectedRupees:
      typeof x.cashCollectedRupees === "number" ? x.cashCollectedRupees : undefined,
    deliveredAt: typeof x.deliveredAt === "string" ? x.deliveredAt : undefined,
    undeliveredReason:
      typeof x.undeliveredReason === "string" ? x.undeliveredReason : undefined,
    riderTokenExpiresAt:
      typeof x.riderTokenExpiresAt === "number" ? x.riderTokenExpiresAt : undefined,
    riderTokenRevokedAt:
      typeof x.riderTokenRevokedAt === "number" ? x.riderTokenRevokedAt : undefined,
    paymentStatus:
      x.paymentStatus === "PAID" || x.paymentStatus === "PENDING"
        ? x.paymentStatus
        : undefined,
    deliveryPartnerId:
      typeof x.deliveryPartnerId === "string" ? x.deliveryPartnerId : undefined,
    deliveryPartnerName:
      typeof x.deliveryPartnerName === "string" ? x.deliveryPartnerName : undefined,
    deliveryAddress:
      typeof x.deliveryAddress === "string" ? x.deliveryAddress : undefined,
    deliveredById:
      typeof x.deliveredById === "string" ? x.deliveredById : undefined,
    deliveredByName:
      typeof x.deliveredByName === "string" ? x.deliveredByName : undefined,
    paidAt: typeof x.paidAt === "string" ? x.paidAt : undefined,
    rtoPendingStockIn: rtoPending ? true : undefined,
    rtoMarkedAt:
      typeof x.rtoMarkedAt === "number" ? x.rtoMarkedAt : undefined,
    rtoStockInAt:
      typeof x.rtoStockInAt === "number" ? x.rtoStockInAt : undefined,
  };
}

function parseOrderDoc(
  id: string,
  x: Record<string, unknown>
): UserOrderRecord {
  return parseUserOrderDocument(id, x);
}

export async function saveUserOrderToFirestore(
  db: Firestore,
  uid: string,
  order: UserOrderRecord
): Promise<void> {
  const ref = doc(db, "users", uid, "orders", order.id);
  await setDoc(ref, order, { merge: true });
}

/** All orders for account page (newest first). */
export async function listUserOrdersFromFirestore(
  db: Firestore,
  uid: string
): Promise<UserOrderRecord[]> {
  const ref = collection(db, "users", uid, "orders");
  const snap = await getDocs(ref);
  const rows: UserOrderRecord[] = [];
  snap.forEach((d) => {
    rows.push(parseOrderDoc(d.id, d.data() as Record<string, unknown>));
  });
  rows.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  return rows;
}

function snapshotToRows(snap: QuerySnapshot): UserOrderRecord[] {
  const rows: UserOrderRecord[] = [];
  snap.forEach((d) => {
    rows.push(parseOrderDoc(d.id, d.data() as Record<string, unknown>));
  });
  rows.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  return rows;
}

/** Live updates when admin patches order in Firestore. */
export function subscribeUserOrdersFromFirestore(
  db: Firestore,
  uid: string,
  onRows: (rows: UserOrderRecord[]) => void,
  onError?: (e: Error) => void
): () => void {
  const ref = collection(db, "users", uid, "orders");
  return onSnapshot(
    ref,
    (snap) => onRows(snapshotToRows(snap)),
    (err) => onError?.(err as Error)
  );
}
