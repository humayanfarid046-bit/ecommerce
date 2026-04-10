"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { canUseFirestoreSync, getFirebaseDb } from "@/lib/firebase/client";
import {
  loadAddressesFromFirestore,
  saveAddressesToFirestore,
} from "@/lib/addresses-firestore";
import { useAuth } from "@/context/auth-context";
import type { AddressLabel, SavedAddress } from "@/lib/saved-address";
import { syncAddressPinsForAdmin } from "@/lib/address-pins-sync";

const STORAGE_KEY = "ecom_addresses_v1";

type AddressesContextValue = {
  addresses: SavedAddress[];
  add: (a: Omit<SavedAddress, "id">) => void;
  update: (id: string, a: Partial<Omit<SavedAddress, "id">>) => void;
  remove: (id: string) => void;
};

const AddressesContext = createContext<AddressesContextValue | null>(null);

function readLocal(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(list: SavedAddress[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function AddressesProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastFirestorePayloadRef = useRef<string | null>(null);
  const firestoreSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    lastFirestorePayloadRef.current = null;
  }, [user?.uid]);

  useEffect(() => {
    setAddresses(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || status !== "ready") return;
    const db = getFirebaseDb();
    if (!user?.uid || !db || !canUseFirestoreSync(user.uid)) return;
    let cancelled = false;
    void (async () => {
      const remote = await loadAddressesFromFirestore(db, user.uid);
      if (cancelled) return;
      const local = readLocal();
      if (remote && remote.length) {
        setAddresses(remote);
        writeLocal(remote);
        lastFirestorePayloadRef.current = JSON.stringify(remote);
      } else if (local.length) {
        await saveAddressesToFirestore(db, user.uid, local);
        lastFirestorePayloadRef.current = JSON.stringify(local);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, hydrated, status]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocal(addresses);
    syncAddressPinsForAdmin(
      addresses,
      user?.email ?? user?.uid ?? "guest"
    );

    const db = getFirebaseDb();
    const uid = user?.uid;
    if (!uid || !db || !canUseFirestoreSync(uid)) return;

    if (firestoreSaveTimerRef.current) {
      clearTimeout(firestoreSaveTimerRef.current);
    }
    firestoreSaveTimerRef.current = setTimeout(() => {
      firestoreSaveTimerRef.current = null;
      const serialized = JSON.stringify(addresses);
      if (lastFirestorePayloadRef.current === serialized) return;
      lastFirestorePayloadRef.current = serialized;
      saveAddressesToFirestore(db, uid, addresses).catch(() => {});
    }, 450);

    return () => {
      if (firestoreSaveTimerRef.current) {
        clearTimeout(firestoreSaveTimerRef.current);
        firestoreSaveTimerRef.current = null;
      }
    };
  }, [addresses, hydrated, user?.uid, user?.email]);

  const add = useCallback((a: Omit<SavedAddress, "id">) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `addr-${Date.now()}`;
    setAddresses((prev) => [...prev, { ...a, id }]);
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Omit<SavedAddress, "id">>) => {
      setAddresses((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
      );
    },
    []
  );

  const remove = useCallback((id: string) => {
    setAddresses((prev) => {
      const next = prev.filter((x) => x.id !== id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ addresses, add, update, remove }),
    [addresses, add, update, remove]
  );

  return (
    <AddressesContext.Provider value={value}>
      {children}
    </AddressesContext.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(AddressesContext);
  if (!ctx) throw new Error("useAddresses must be used within AddressesProvider");
  return ctx;
}

export type { AddressLabel, SavedAddress };
