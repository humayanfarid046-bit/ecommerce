"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  getStorefrontProducts,
  setRemoteCatalogSnapshot,
  fetchRemoteCatalogSnapshot,
  CATALOG_EVENT,
  CATALOG_LOCALSTORAGE_KEY,
} from "@/lib/catalog-products-storage";
import type { Product } from "@/lib/product-model";

/** Live catalog: localStorage + GET /api/catalog (Firestore), merged. */
export function useCatalogProducts(): Product[] {
  const { user } = useAuth();
  const [rows, setRows] = useState<Product[]>([]);

  const sync = useCallback(() => {
    setRows(getStorefrontProducts());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(CATALOG_EVENT, sync);
    return () => window.removeEventListener(CATALOG_EVENT, sync);
  }, [sync]);

  /** Hydrate from Firestore; re-run when auth changes so logged-in sessions get the same merged catalog. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const remote = await fetchRemoteCatalogSnapshot();
        if (cancelled) return;
        setRemoteCatalogSnapshot(remote);
      } catch {
        if (!cancelled) setRemoteCatalogSnapshot([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  /** Another tab saved the catalogue — refetch server copy. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CATALOG_LOCALSTORAGE_KEY) return;
      void (async () => {
        try {
          const remote = await fetchRemoteCatalogSnapshot();
          setRemoteCatalogSnapshot(remote);
        } catch {
          /* ignore */
        }
      })();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return rows;
}
