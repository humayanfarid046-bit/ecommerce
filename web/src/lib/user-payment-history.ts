/** User-facing payment & refund history — localStorage + optional Firestore (signed-in users). */

import {
  canUseFirestoreSync,
  getFirebaseAuth,
  getFirebaseDb,
} from "@/lib/firebase/client";
import { savePaymentHistoryToFirestore } from "@/lib/payment-history-firestore";

const KEY = "lc_user_payment_history_v1";

export type RefundStep = "none" | "bank_processing" | "refunded";

export type UserPaymentRecord = {
  id: string;
  orderId: string;
  paymentTxnId: string;
  amountRupees: number;
  method: string;
  at: string;
  status: "success" | "failed";
  refundStep: RefundStep;
  /** When refund completes */
  refundTxnId?: string;
};

function read(): UserPaymentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as UserPaymentRecord[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(list: UserPaymentRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  try {
    window.dispatchEvent(new CustomEvent("lc-user-payment-history"));
  } catch {
    /* ignore */
  }
  const uid = getFirebaseAuth()?.currentUser?.uid;
  if (!uid || !canUseFirestoreSync(uid)) return;
  const db = getFirebaseDb();
  if (db) {
    savePaymentHistoryToFirestore(db, uid, list).catch(() => {});
  }
}

export function getUserPaymentHistory(): UserPaymentRecord[] {
  return read().sort((a, b) => b.at.localeCompare(a.at));
}

/** Merge Firestore + local on login (by id, newest `at` wins on tie). */
export function mergeHydratedPaymentHistory(remote: UserPaymentRecord[]): void {
  const local = read();
  const byId = new Map<string, UserPaymentRecord>();
  for (const r of local) byId.set(r.id, r);
  for (const r of remote) {
    const prev = byId.get(r.id);
    if (!prev || r.at >= prev.at) byId.set(r.id, r);
  }
  const merged = Array.from(byId.values())
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 80);
  write(merged);
}

export function recordUserPayment(entry: Omit<UserPaymentRecord, "id">) {
  const id = `upay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const list = [{ ...entry, id }, ...read()];
  write(list.slice(0, 80));
}
