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
import { loadCartFromFirestore, saveCartToFirestore } from "@/lib/cart-firestore";
import { useAuth } from "@/context/auth-context";
import type { CartItem } from "@/lib/cart-types";

export type { CartItem };

const STORAGE_KEY = "ecom_cart_v1";

type CartContextValue = {
  items: CartItem[];
  addItem: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readLocal(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || status !== "ready") return;
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      (async () => {
        const remote = await loadCartFromFirestore(db, user.uid);
        if (remote && remote.length) {
          const merged = mergeCarts(readLocal(), remote);
          setItems(merged);
          writeLocal(merged);
          await saveCartToFirestore(db, user.uid, merged);
        } else {
          await saveCartToFirestore(db, user.uid, readLocal());
        }
      })();
    }
  }, [user?.uid, hydrated, status]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocal(items);
    const db = getFirebaseDb();
    if (user?.uid && db && canUseFirestoreSync(user.uid)) {
      saveCartToFirestore(db, user.uid, items).catch(() => {});
    }
  }, [items, hydrated, user?.uid]);

  const addItem = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === productId);
      if (i === -1) return [...prev, { productId, qty }];
      const next = [...prev];
      next[i] = { ...next[i]!, qty: next[i]!.qty + qty };
      return next;
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((x) => x.productId !== productId);
      const i = prev.findIndex((x) => x.productId === productId);
      if (i === -1) return [...prev, { productId, qty }];
      const next = [...prev];
      next[i] = { productId, qty };
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, addItem, setQty, removeItem, clear }),
    [items, addItem, setQty, removeItem, clear]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, number>();
  for (const x of a) map.set(x.productId, (map.get(x.productId) ?? 0) + x.qty);
  for (const x of b) map.set(x.productId, (map.get(x.productId) ?? 0) + x.qty);
  return Array.from(map.entries()).map(([productId, qty]) => ({ productId, qty }));
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
