import type { AdminUserRow, UserSegment } from "@/lib/admin-types";

export function defaultUserSegment(): UserSegment {
  return "new";
}

export function emptyAdminUserRow(uid: string, email: string): AdminUserRow {
  return {
    id: uid,
    name: "—",
    email: email || "—",
    phone: "",
    orders: 0,
    blocked: false,
    lastActive: "—",
    totalSpent: 0,
    segment: defaultUserSegment(),
    lastLogin: "—",
    wishlistItems: [],
    lastSearches: [],
    walletBalance: 0,
    referralInvites: 0,
    verified: true,
    suspicious: false,
    shadowBanned: false,
    fraudFlags: { highCancels: false, otpFails: false },
    codRefusedCount: 0,
  };
}

/** Premium > inactive (no login 90d) > new; order count drives premium. */
export function computeUserSegment(opts: {
  orderCount: number;
  lastSignInMs: number | null;
}): UserSegment {
  if (opts.orderCount > 3) return "premium";
  if (opts.lastSignInMs == null) return "inactive";
  const ms90d = 90 * 86400000;
  if (Date.now() - opts.lastSignInMs > ms90d) return "inactive";
  return defaultUserSegment();
}
