/**
 * On sign-in, pull Firestore cloud data into local caches so the storefront matches the database.
 * - Profile, wallet, payment history merge here.
 * - Orders: real-time subscription on account orders page (`subscribeUserOrdersFromFirestore`).
 * - Delivery partners: lists/updates via `/api/delivery/dashboard` (Admin SDK reads collectionGroup orders + riderWallets).
 */

import {
  canUseFirestoreSync,
  getFirebaseDb,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import { loadProfileFromFirestore } from "@/lib/profile-firestore";
import { loadWalletFromFirestore } from "@/lib/wallet-firestore";
import { loadPaymentHistoryFromFirestore } from "@/lib/payment-history-firestore";
import { mergeHydratedPaymentHistory } from "@/lib/user-payment-history";
import { readProfile } from "@/lib/account-profile-storage";
import { sanitizeGender, type StoredProfile } from "@/lib/types/profile";
import type { WalletState } from "@/lib/wallet-storage";

const PROFILE_KEY = "libas_account_profile_v1";

function mergeProfile(
  local: ReturnType<typeof readProfile>,
  remote: Partial<StoredProfile> | null
): StoredProfile {
  if (!remote) return local;
  return {
    ...local,
    ...remote,
    gender: sanitizeGender(remote.gender ?? local.gender),
    photoDataUrl: remote.photoDataUrl ?? local.photoDataUrl,
  };
}

/** Overwrite local profile cache with merged remote (Firestore wins on conflict fields). */
export async function hydrateProfileFromFirestore(uid: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getFirebaseDb();
  if (!db || typeof window === "undefined") return;
  try {
    const remote = await loadProfileFromFirestore(db, uid);
    if (!remote || Object.keys(remote).length === 0) return;
    const local = readProfile();
    const merged = mergeProfile(local, remote);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("lc-profile"));
  } catch {
    /* offline / permission */
  }
}

function writeWalletLocal(uid: string, w: WalletState) {
  const key = `lc_wallet_v3_${uid}`;
  localStorage.setItem(key, JSON.stringify(w));
  window.dispatchEvent(new CustomEvent("lc-wallet"));
}

/** Prefer Firestore wallet on login (source of truth for cloud). */
export async function hydrateWalletFromFirestore(uid: string): Promise<void> {
  if (!isFirebaseConfigured() || !canUseFirestoreSync(uid)) return;
  const db = getFirebaseDb();
  if (!db || typeof window === "undefined") return;
  try {
    const remote = await loadWalletFromFirestore(db, uid);
    if (!remote) return;
    writeWalletLocal(uid, remote);
  } catch {
    /* ignore */
  }
}

export async function hydratePaymentHistoryFromFirestore(
  uid: string
): Promise<void> {
  if (!isFirebaseConfigured() || !canUseFirestoreSync(uid)) return;
  const db = getFirebaseDb();
  if (!db || typeof window === "undefined") return;
  try {
    const remote = await loadPaymentHistoryFromFirestore(db, uid);
    if (!remote?.length) return;
    mergeHydratedPaymentHistory(remote);
  } catch {
    /* offline / permission */
  }
}

export async function hydrateUserDataFromFirestore(uid: string): Promise<void> {
  await Promise.all([
    hydrateProfileFromFirestore(uid),
    hydrateWalletFromFirestore(uid),
    hydratePaymentHistoryFromFirestore(uid),
  ]);
}
