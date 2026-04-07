"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWishlist } from "@/context/wishlist-context";
import { getProductById } from "@/lib/mock-data";
import { priceDropAmount } from "@/lib/wishlist-price-snapshot";
import { effectiveUnitPriceAfterCategoryDiscount } from "@/lib/category-discount-storage";
import {
  readNotifications,
  writeNotifications,
  seedIfEmpty,
  type AppNotification,
} from "@/lib/notifications-storage";

type NotificationsContextValue = {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refreshPriceAlerts: () => void;
  refreshStockAlerts: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ids: wishIds } = useWishlist();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedIfEmpty();
    setItems(readNotifications());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function sync() {
      setItems(readNotifications());
    }
    window.addEventListener("lc-notifications", sync);
    return () => window.removeEventListener("lc-notifications", sync);
  }, []);

  const refreshPriceAlerts = useCallback(() => {
    setItems((prev) => {
      const next = [...prev];
      for (const id of wishIds) {
        const p = getProductById(id);
        if (!p) continue;
        const drop = priceDropAmount(
          id,
          effectiveUnitPriceAfterCategoryDiscount(p.price, p.categorySlug)
        );
        if (drop != null && drop > 0) {
          const nid = `price_${id}`;
          if (next.some((n) => n.id === nid)) continue;
          const title = p.title.slice(0, 48);
          next.unshift({
            id: nid,
            type: "price",
            titleKey: "priceDropTitle",
            bodyKey: "priceDropBody",
            read: false,
            createdAt: Date.now(),
            productId: id,
            values: {
              amount: drop.toLocaleString("en-IN"),
              productName: title,
            },
          });
        }
      }
      writeNotifications(next);
      return next;
    });
  }, [wishIds]);

  const refreshStockAlerts = useCallback(() => {
    setItems((prev) => {
      const next = [...prev];
      for (const id of wishIds) {
        const p = getProductById(id);
        if (!p) continue;
        const sl = p.stockLeft;
        if (sl == null || sl >= 5) continue;
        const nid = `stock_${id}`;
        if (next.some((n) => n.id === nid)) continue;
        const title = p.title.slice(0, 48);
        next.unshift({
          id: nid,
          type: "stock",
          titleKey: "hurryUpTitle",
          bodyKey: "hurryUpBody",
          read: false,
          createdAt: Date.now(),
          productId: id,
          values: {
            stockLeft: String(sl),
            productName: title,
          },
        });
      }
      writeNotifications(next);
      return next;
    });
  }, [wishIds]);

  useEffect(() => {
    if (!hydrated) return;
    refreshPriceAlerts();
  }, [hydrated, wishIds, refreshPriceAlerts]);

  useEffect(() => {
    if (!hydrated) return;
    refreshStockAlerts();
  }, [hydrated, wishIds, refreshStockAlerts]);

  const markRead = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      writeNotifications(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      writeNotifications(next);
      return next;
    });
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      markRead,
      markAllRead,
      refreshPriceAlerts,
      refreshStockAlerts,
    }),
    [items, unreadCount, markRead, markAllRead, refreshPriceAlerts, refreshStockAlerts]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
