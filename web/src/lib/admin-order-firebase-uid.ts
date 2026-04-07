/** Maps admin order row id → customer Firebase Auth UID (for server PATCH). */

const KEY = "lc_admin_order_firebase_uid_v1";

function readAll(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return {};
    return JSON.parse(s) as Record<string, string>;
  } catch {
    return {};
  }
}

export function getAdminOrderFirebaseUid(orderId: string): string {
  return readAll()[orderId]?.trim() ?? "";
}

export function setAdminOrderFirebaseUid(orderId: string, uid: string): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  const t = uid.trim();
  if (t) all[orderId] = t;
  else delete all[orderId];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
