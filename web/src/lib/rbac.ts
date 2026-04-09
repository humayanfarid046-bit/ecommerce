export const APP_ROLES = ["ADMIN", "CUSTOMER", "DELIVERY_PARTNER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function normalizeAppRole(v: unknown): AppRole {
  const x = String(v ?? "")
    .trim()
    .toUpperCase();
  if (x === "ADMIN" || x === "DELIVERY_PARTNER" || x === "CUSTOMER") return x;
  return "CUSTOMER";
}

