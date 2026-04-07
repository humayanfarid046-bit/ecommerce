/**
 * Per-user wallet — localStorage + optional Firestore sync when Firebase user.
 */

import { canUseFirestoreSync, getFirebaseDb } from "@/lib/firebase/client";
import { saveWalletToFirestore } from "@/lib/wallet-firestore";

const LEGACY_KEY = "lc_user_wallet_v1";
const PREFIX = "lc_wallet_v3_";

export type WalletLedgerEntry = {
  id: string;
  at: string;
  deltaPaise: number;
  /** Human-readable line */
  label: string;
  kind:
    | "recharge"
    | "order"
    | "refund"
    | "admin_credit"
    | "admin_debit"
    | "adjustment";
  orderId?: string;
  externalRef?: string;
};

export type WalletState = {
  balancePaise: number;
  ledger: WalletLedgerEntry[];
};

const LEDGER_KINDS = new Set<WalletLedgerEntry["kind"]>([
  "recharge",
  "order",
  "refund",
  "admin_credit",
  "admin_debit",
  "adjustment",
]);

const MAX_LEDGER = 500;

/** Normalize Firestore/localStorage JSON so balance/ledger stay valid. */
export function normalizeWalletState(raw: Partial<WalletState>): WalletState {
  const balancePaise = Math.max(0, Math.floor(Number(raw.balancePaise) || 0));
  const ledgerIn = Array.isArray(raw.ledger) ? raw.ledger : [];
  const ledger: WalletLedgerEntry[] = [];
  for (let i = 0; i < ledgerIn.length && ledger.length < MAX_LEDGER; i++) {
    const e = ledgerIn[i];
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const delta = Number(o.deltaPaise);
    if (!Number.isFinite(delta)) continue;
    const kindRaw = o.kind;
    const kind =
      typeof kindRaw === "string" &&
      LEDGER_KINDS.has(kindRaw as WalletLedgerEntry["kind"])
        ? (kindRaw as WalletLedgerEntry["kind"])
        : "adjustment";
    const id =
      typeof o.id === "string" && o.id.length > 0
        ? o.id
        : `norm_${i}_${Math.random().toString(36).slice(2, 8)}`;
    const at = typeof o.at === "string" ? o.at : new Date().toISOString();
    const label = typeof o.label === "string" ? o.label : "";
    const entry: WalletLedgerEntry = {
      id,
      at,
      deltaPaise: Math.round(delta),
      label,
      kind,
    };
    if (typeof o.orderId === "string") entry.orderId = o.orderId;
    if (typeof o.externalRef === "string") entry.externalRef = o.externalRef;
    ledger.push(entry);
  }
  return { balancePaise, ledger };
}

function defaultWallet(): WalletState {
  return { balancePaise: 0, ledger: [] };
}

function storageKey(uid: string) {
  return `${PREFIX}${uid}`;
}

function migrateLegacy(uid: string): WalletState | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(LEGACY_KEY);
    if (!s) return null;
    const p = JSON.parse(s) as {
      balancePaise?: number;
      ledger?: { at: string; label: string; deltaPaise: number }[];
    };
    const ledger: WalletLedgerEntry[] = (p.ledger ?? []).map((e, i) => ({
      id: `mig-${i}-${e.at}`,
      at: e.at,
      deltaPaise: e.deltaPaise,
      label: e.label,
      kind: e.deltaPaise >= 0 ? "adjustment" : "order",
    }));
    const w = normalizeWalletState({
      balancePaise: Math.max(0, p.balancePaise ?? 0),
      ledger,
    });
    localStorage.setItem(storageKey(uid), JSON.stringify(w));
    localStorage.removeItem(LEGACY_KEY);
    return w;
  } catch {
    return null;
  }
}

function read(uid: string): WalletState {
  if (typeof window === "undefined") return defaultWallet();
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) {
      const mig = migrateLegacy(uid);
      if (mig) return mig;
      return defaultWallet();
    }
    const p = JSON.parse(raw) as Partial<WalletState>;
    return normalizeWalletState({
      balancePaise: p.balancePaise,
      ledger: Array.isArray(p.ledger) ? p.ledger : [],
    });
  } catch {
    return defaultWallet();
  }
}

function save(uid: string, w: WalletState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(uid), JSON.stringify(w));
  window.dispatchEvent(new CustomEvent("lc-wallet"));
  const db = getFirebaseDb();
  if (db && canUseFirestoreSync(uid)) {
    saveWalletToFirestore(db, uid, w).catch(() => {});
  }
}

function newId() {
  return `wtx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Resolve storage uid: Firebase / demo session uid, or guest checkout */
export function walletUserId(user: { uid: string } | null): string {
  return user?.uid ?? "guest";
}

export function getWallet(uid: string): WalletState {
  return read(uid);
}

export function getBalancePaise(uid: string): number {
  return read(uid).balancePaise;
}

export function creditWalletPaise(
  uid: string,
  amount: number,
  label: string,
  opts?: {
    kind?: WalletLedgerEntry["kind"];
    orderId?: string;
    externalRef?: string;
  }
) {
  if (amount <= 0) return;
  const w = read(uid);
  w.balancePaise += amount;
  w.ledger.unshift({
    id: newId(),
    at: new Date().toISOString(),
    deltaPaise: amount,
    label,
    kind: opts?.kind ?? "adjustment",
    orderId: opts?.orderId,
    externalRef: opts?.externalRef,
  });
  save(uid, w);
}

export function debitWalletPaise(
  uid: string,
  amount: number,
  label: string,
  opts?: { kind?: WalletLedgerEntry["kind"]; orderId?: string }
): boolean {
  if (amount <= 0) return true;
  const w = read(uid);
  if (w.balancePaise < amount) return false;
  w.balancePaise -= amount;
  w.ledger.unshift({
    id: newId(),
    at: new Date().toISOString(),
    deltaPaise: -amount,
    label,
    kind: opts?.kind ?? "order",
    orderId: opts?.orderId,
  });
  save(uid, w);
  return true;
}

/** Roll back a credit (e.g. failed order after wallet debit) — demo helper */
export function creditWalletPaiseUndo(uid: string, entryId: string) {
  const w = read(uid);
  const ix = w.ledger.findIndex((e) => e.id === entryId);
  if (ix === -1) return false;
  const e = w.ledger[ix]!;
  if (e.deltaPaise >= 0) {
    w.balancePaise = Math.max(0, w.balancePaise - e.deltaPaise);
  } else {
    w.balancePaise += -e.deltaPaise;
  }
  w.ledger.splice(ix, 1);
  save(uid, w);
  return true;
}

/** All wallet keys in this browser (for admin audit / analytics demo) */
export function listWalletStorageKeys(): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  return keys;
}

export function aggregateWalletAnalytics(): {
  totalBalancePaise: number;
  rechargeCreditsPaise: number;
  orderDebitsPaise: number;
  entryCount: number;
} {
  let totalBalancePaise = 0;
  let rechargeCreditsPaise = 0;
  let orderDebitsPaise = 0;
  let entryCount = 0;
  for (const key of listWalletStorageKeys()) {
    try {
      const w = JSON.parse(
        localStorage.getItem(key) ?? "{}"
      ) as WalletState;
      totalBalancePaise += w.balancePaise ?? 0;
      for (const e of w.ledger ?? []) {
        entryCount += 1;
        if (e.deltaPaise > 0 && e.kind === "recharge") {
          rechargeCreditsPaise += e.deltaPaise;
        }
        if (e.deltaPaise < 0 && e.kind === "order") {
          orderDebitsPaise += -e.deltaPaise;
        }
      }
    } catch {
      /* skip */
    }
  }
  return {
    totalBalancePaise,
    rechargeCreditsPaise,
    orderDebitsPaise,
    entryCount,
  };
}
