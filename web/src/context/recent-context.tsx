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
  loadRecentFromFirestore,
  saveRecentToFirestore,
} from "@/lib/recent-firestore";
import { useAuth } from "@/context/auth-context";

const STORAGE_KEY = "ecom_recent_v1";
const MAX = 20;

type RecentContextValue = {
  productIds: string[];
  recordView: (productId: string) => void;
};

const RecentContext = createContext<RecentContextValue | null>(null);

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

export function RecentProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProductIds(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || status !== "ready") return;
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      (async () => {
        const remote = await loadRecentFromFirestore(db, user.uid);
        if (remote && remote.length) {
          const merged = Array.from(
            new Set([...readLocal(), ...remote])
          ).slice(0, MAX);
          setProductIds(merged);
          writeLocal(merged);
          await saveRecentToFirestore(db, user.uid, merged);
        } else {
          await saveRecentToFirestore(db, user.uid, readLocal());
        }
      })();
    }
  }, [user?.uid, hydrated, status]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocal(productIds);
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      saveRecentToFirestore(db, user.uid, productIds).catch(() => {});
    }
  }, [productIds, hydrated, user?.uid]);

  const recordView = useCallback((productId: string) => {
    setProductIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)];
      return next.slice(0, MAX);
    });
  }, []);

  const value = useMemo(
    () => ({ productIds, recordView }),
    [productIds, recordView]
  );

  return (
    <RecentContext.Provider value={value}>{children}</RecentContext.Provider>
  );
}

export function useRecent() {
  const ctx = useContext(RecentContext);
  if (!ctx) throw new Error("useRecent must be used within RecentProvider");
  return ctx;
}
