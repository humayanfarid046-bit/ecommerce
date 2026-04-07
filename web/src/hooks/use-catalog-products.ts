"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/product-model";
import { CATALOG_EVENT } from "@/lib/catalog-products-storage";

/** Live snapshot of catalog from localStorage (empty on SSR until hydrated). */
export function useCatalogProducts(): Product[] {
  const [rows, setRows] = useState<Product[]>([]);
  useEffect(() => {
    const sync = () => setRows(getProducts());
    sync();
    window.addEventListener(CATALOG_EVENT, sync);
    return () => window.removeEventListener(CATALOG_EVENT, sync);
  }, []);
  return rows;
}
