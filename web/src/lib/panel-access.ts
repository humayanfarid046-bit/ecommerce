export type AccessScope = "owner" | "operations" | "catalog" | "none";

export type AccessModule =
  | "dashboard"
  | "products"
  | "inventory"
  | "orders"
  | "users"
  | "payments"
  | "content"
  | "settings"
  | "support"
  | "seo";

export type AccessPermissions = Record<AccessModule, boolean>;

const OWNER: AccessPermissions = {
  dashboard: true,
  products: true,
  inventory: true,
  orders: true,
  users: true,
  payments: true,
  content: true,
  settings: true,
  support: true,
  seo: true,
};

const OPERATIONS: AccessPermissions = {
  dashboard: true,
  products: false,
  inventory: true,
  orders: true,
  users: false,
  payments: true,
  content: false,
  settings: false,
  support: true,
  seo: false,
};

const CATALOG: AccessPermissions = {
  dashboard: true,
  products: true,
  inventory: true,
  orders: false,
  users: false,
  payments: false,
  content: true,
  settings: false,
  support: false,
  seo: true,
};

const NONE: AccessPermissions = {
  dashboard: false,
  products: false,
  inventory: false,
  orders: false,
  users: false,
  payments: false,
  content: false,
  settings: false,
  support: false,
  seo: false,
};

export function normalizeAccessScope(v: unknown): AccessScope {
  const raw = String(v ?? "").trim().toLowerCase();
  if (raw === "owner" || raw === "admin" || raw === "superadmin") return "owner";
  if (raw === "operations" || raw === "ops") return "operations";
  if (raw === "catalog") return "catalog";
  return "none";
}

export function resolveAccessScopeFromRecord(
  data: Record<string, unknown> | undefined
): AccessScope {
  if (!data) return "none";
  if (data.isAdmin === true) return "owner";
  return normalizeAccessScope(data.accessScope ?? data.scope ?? data.role);
}

export function permissionsForScope(scope: AccessScope): AccessPermissions {
  if (scope === "owner") return OWNER;
  if (scope === "operations") return OPERATIONS;
  if (scope === "catalog") return CATALOG;
  return NONE;
}

export function canAccess(scope: AccessScope, mod: AccessModule): boolean {
  return permissionsForScope(scope)[mod];
}
