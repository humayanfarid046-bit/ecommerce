"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { canUseFirestoreSync, getFirebaseDb } from "@/lib/firebase/client";
import {
  loadCompareFromFirestore,
  saveCompareToFirestore,
} from "@/lib/compare-firestore";
import { useAuth } from "@/context/auth-context";

const MAX = 3;

const STORAGE_KEY = "ecom_compare_v1";

type CompareContextValue = {
  ids: string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function mergeIds(a: string[], b: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of [...a, ...b]) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
    if (out.length >= MAX) break;
  }
  return out;
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || status !== "ready") return;
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      void (async () => {
        const remote = await loadCompareFromFirestore(db, user.uid);
        if (remote && remote.length) {
          const merged = mergeIds(readLocal(), remote);
          setIds(merged);
          writeLocal(merged);
          await saveCompareToFirestore(db, user.uid, merged);
        } else {
          await saveCompareToFirestore(db, user.uid, readLocal());
        }
      })();
    }
  }, [user?.uid, hydrated, status]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocal(ids);
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      saveCompareToFirestore(db, user.uid, ids).catch(() => {});
    }
  }, [ids, hydrated, user?.uid]);

  const add = useCallback((productId: string) => {
    setIds((prev) => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX) return [...prev.slice(1), productId];
      return [...prev, productId];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((x) => x !== productId));
  }, []);

  const has = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, add, remove, has, clear }),
    [ids, add, remove, has, clear]
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
