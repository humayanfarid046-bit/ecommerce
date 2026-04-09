/** In-app notification items (localStorage; real events from checkout, etc.). */

export type AppNotification = {
  id: string;
  type: "order" | "coupon" | "price" | "stock";
  titleKey: string;
  bodyKey: string;
  read: boolean;
  createdAt: number;
  productId?: string;
  /** ICU values for body/title (e.g. amount, productName) */
  values?: Record<string, string>;
};

const KEY = "libas_notifications_v1";

export function readNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as AppNotification[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function writeNotifications(items: AppNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

/** Call after a successful checkout — shows in bell inbox + bumps unread count. */
export function prependOrderPlacedNotification(
  orderId: string,
  totalRupees: number,
  methodLabel: string
): void {
  if (typeof window === "undefined") return;
  const id = `n_order_${orderId}_${Date.now()}`;
  const next: AppNotification[] = [
    {
      id,
      type: "order",
      titleKey: "orderPlacedTitle",
      bodyKey: "orderPlacedBody",
      read: false,
      createdAt: Date.now(),
      values: {
        orderId,
        amount: totalRupees.toLocaleString("en-IN"),
        method: methodLabel,
      },
    },
    ...readNotifications(),
  ];
  writeNotifications(next);
  try {
    window.dispatchEvent(new CustomEvent("lc-notifications"));
  } catch {
    /* ignore */
  }
}

export function seedIfEmpty(): AppNotification[] {
  return readNotifications();
}
