"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMergedProducts,
  setRemoteCatalogSnapshot,
  CATALOG_EVENT,
  CATALOG_LOCALSTORAGE_KEY,
} from "@/lib/catalog-products-storage";
import type { Product } from "@/lib/product-model";

/** Live catalog: localStorage + GET /api/catalog (Firestore), merged. */
export function useCatalogProducts(): Product[] {
  const [rows, setRows] = useState<Product[]>([]);

  const sync = useCallback(() => {
    setRows(getMergedProducts());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(CATALOG_EVENT, sync);
    return () => window.removeEventListener(CATALOG_EVENT, sync);
  }, [sync]);

  /** Hydrate from Firestore so other browsers / logged-in users see the same products. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        const j = (await res.json()) as { products?: Product[] };
        if (cancelled) return;
        setRemoteCatalogSnapshot(Array.isArray(j.products) ? j.products : []);
      } catch {
        if (!cancelled) setRemoteCatalogSnapshot([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Another tab saved the catalogue — refetch server copy. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CATALOG_LOCALSTORAGE_KEY) return;
      void (async () => {
        try {
          const res = await fetch("/api/catalog", { cache: "no-store" });
          const j = (await res.json()) as { products?: Product[] };
          setRemoteCatalogSnapshot(Array.isArray(j.products) ? j.products : []);
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
