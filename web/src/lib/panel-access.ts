export type AccessScope = "owner" | "operations" | "catalog" | "none";

export type AccessModule =
  | "dashboard"
  | "products"
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
  orders: false,
  users: false,
  payments: false,
  content: false,
  settings: false,
  support: false,
  seo: false,
};

export function normalizeAccessScope(v: unknown): AccessScope {
  return v === "owner" || v === "operations" || v === "catalog" ? v : "none";
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
