import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

const COL = "riderWallets";

export async function creditRiderWalletOnDelivery(
  db: Firestore,
  riderUid: string,
  amounts: { cashRupees: number; onlineRupees: number }
): Promise<void> {
  const cashPaise = Math.max(0, Math.round(amounts.cashRupees * 100));
  const onlinePaise = Math.max(0, Math.round(amounts.onlineRupees * 100));
  if (cashPaise === 0 && onlinePaise === 0) return;
  const patch: Record<string, unknown> = {
    riderUid,
    updatedAt: Date.now(),
  };
  if (cashPaise > 0) patch.cashInHandPaise = FieldValue.increment(cashPaise);
  if (onlinePaise > 0) patch.lifetimeOnlineReportedPaise = FieldValue.increment(onlinePaise);
  await db.doc(`${COL}/${riderUid}`).set(patch, { merge: true });
}

export async function settleRiderCash(
  db: Firestore,
  riderUid: string,
  adminUid: string
): Promise<{ settledCashPaise: number }> {
  const ref = db.doc(`${COL}/${riderUid}`);
  const snap = await ref.get();
  const cashInHandPaise = Math.max(0, Math.floor(Number(snap.data()?.cashInHandPaise) || 0));
  if (cashInHandPaise <= 0) {
    return { settledCashPaise: 0 };
  }
  await ref.set(
    {
      cashInHandPaise: 0,
      lastSettledAt: Date.now(),
      lastSettledCashPaise: cashInHandPaise,
      lastSettledBy: adminUid,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  await ref.collection("settlements").add({
    cashPaise: cashInHandPaise,
    at: Date.now(),
    byAdminUid: adminUid,
  });
  return { settledCashPaise: cashInHandPaise };
}
