const KEY = "libas_notification_prefs_v1";

export type NotificationPrefs = {
  emailOffers: boolean;
  smsOffers: boolean;
  pushOffers: boolean;
  orderUpdates: boolean;
  promoOffers: boolean;
};

const defaults: NotificationPrefs = {
  emailOffers: true,
  smsOffers: false,
  pushOffers: true,
  orderUpdates: true,
  promoOffers: true,
};

export function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function writeNotificationPrefs(p: Partial<NotificationPrefs>) {
  if (typeof window === "undefined") return;
  try {
    const cur = readNotificationPrefs();
    localStorage.setItem(KEY, JSON.stringify({ ...cur, ...p }));
  } catch {
    /* ignore */
  }
}
