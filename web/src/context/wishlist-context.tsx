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
  loadWishlistFromFirestore,
  saveWishlistToFirestore,
} from "@/lib/wishlist-firestore";
import { useAuth } from "@/context/auth-context";
import { removeSnapshot } from "@/lib/wishlist-price-snapshot";
import { bumpWishlistProductCount } from "@/lib/wishlist-counts-sync";

const STORAGE_KEY = "ecom_wishlist_v1";

type WishlistContextValue = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

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
  return Array.from(new Set([...a, ...b]));
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
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
      (async () => {
        const remote = await loadWishlistFromFirestore(db, user.uid);
        if (remote && remote.length) {
          const merged = mergeIds(readLocal(), remote);
          setIds(merged);
          writeLocal(merged);
          await saveWishlistToFirestore(db, user.uid, merged);
        } else {
          await saveWishlistToFirestore(db, user.uid, readLocal());
        }
      })();
    }
  }, [user?.uid, hydrated, status]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocal(ids);
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      saveWishlistToFirestore(db, user.uid, ids).catch(() => {});
    }
  }, [ids, hydrated, user?.uid]);

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      if (prev.includes(productId)) {
        removeSnapshot(productId);
        bumpWishlistProductCount(productId, -1);
        return prev.filter((x) => x !== productId);
      }
      bumpWishlistProductCount(productId, 1);
      return [...prev, productId];
    });
  }, []);

  const has = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const remove = useCallback((productId: string) => {
    removeSnapshot(productId);
    bumpWishlistProductCount(productId, -1);
    setIds((prev) => prev.filter((x) => x !== productId));
  }, []);

  const value = useMemo(
    () => ({ ids, toggle, has, remove }),
    [ids, toggle, has, remove]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
