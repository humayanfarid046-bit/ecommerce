/** Merge demo admin edits (block, wallet, shadow) so they survive refresh — client only. */

import type { AdminUserRow } from "@/lib/admin-mock-data";

const KEY = "lc_admin_user_overrides_v1";

export type UserOverride = Partial<
  Pick<
    AdminUserRow,
    | "blocked"
    | "banReason"
    | "suspicious"
    | "shadowBanned"
    | "walletBalance"
  >
>;

function readAll(): Record<string, UserOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, UserOverride>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, UserOverride>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function mergeUserOverrides(rows: AdminUserRow[]): AdminUserRow[] {
  const o = readAll();
  return rows.map((u) => {
    const p = o[u.id];
    if (!p) return u;
    return { ...u, ...p };
  });
}

export function patchUserOverride(id: string, patch: UserOverride) {
  const all = readAll();
  all[id] = { ...(all[id] ?? {}), ...patch };
  writeAll(all);
}
