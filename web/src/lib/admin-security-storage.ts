/** Client-only: tax, demo admin role, activity log (replace with API + auth). */

import { saveShippingRules, type ShippingRulesState } from "@/lib/shipping-rules-storage";

const TAX_KEY = "lc_tax_shipping_v1";
const ROLE_KEY = "lc_admin_role_v1";
const ACT_KEY = "lc_admin_activity_v1";
const MAX_LOGS = 120;

export type TaxShippingConfig = {
  taxPercent: number;
  /** Reference flat rates (₹) — use with PIN rules as needed. */
  metroFlat: number;
  restFlat: number;
};

export const defaultTaxShipping: TaxShippingConfig = {
  taxPercent: 18,
  metroFlat: 40,
  restFlat: 60,
};

export const ADMIN_MODULES = [
  "dashboard",
  "products",
  "orders",
  "users",
  "payments",
  "content",
  "settings",
  "support",
  "seo",
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];

export type AdminPermissions = Record<AdminModule, boolean>;

export type RolePreset = "super" | "orders_only" | "catalog_only";

/** Default (super admin) — use as initial UI state before hydrating from storage. */
export const fullPermissions: AdminPermissions = {
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

const PRESETS: Record<RolePreset, AdminPermissions> = {
  super: fullPermissions,
  orders_only: {
    dashboard: true,
    products: false,
    orders: true,
    users: false,
    payments: true,
    content: false,
    /** Keep open so staff can switch role / view audit (demo). */
    settings: true,
    support: true,
    seo: false,
  },
  catalog_only: {
    dashboard: true,
    products: true,
    orders: false,
    users: false,
    payments: false,
    content: true,
    settings: true,
    support: false,
    seo: true,
  },
};

export type ActivityLogEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
};

function uid() {
  return `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readTax(): TaxShippingConfig {
  if (typeof window === "undefined") return defaultTaxShipping;
  try {
    const s = localStorage.getItem(TAX_KEY);
    if (!s) return defaultTaxShipping;
    const p = JSON.parse(s) as Partial<TaxShippingConfig>;
    return { ...defaultTaxShipping, ...p };
  } catch {
    return defaultTaxShipping;
  }
}

export function getTaxShippingConfig(): TaxShippingConfig {
  return readTax();
}

export function saveTaxShippingConfig(
  next: TaxShippingConfig,
  opts?: { log?: boolean }
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TAX_KEY, JSON.stringify(next));
  if (opts?.log !== false) {
    appendActivityLog({
      actor: "admin",
      action: "settings.tax_shipping_saved",
      detail: `GST ${next.taxPercent}% · metro ₹${next.metroFlat} · rest ₹${next.restFlat}`,
    });
  }
  window.dispatchEvent(new CustomEvent("lc-admin-settings"));
}

export function getTaxPercent(): number {
  return getTaxShippingConfig().taxPercent;
}

export function getRolePreset(): RolePreset {
  if (typeof window === "undefined") return "super";
  try {
    const v = localStorage.getItem(ROLE_KEY) as RolePreset | null;
    if (v === "orders_only" || v === "catalog_only" || v === "super") return v;
    return "super";
  } catch {
    return "super";
  }
}

export function setRolePreset(
  role: RolePreset,
  opts?: { log?: boolean }
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
  if (opts?.log !== false) {
    appendActivityLog({
      actor: "admin",
      action: "settings.role_changed",
      detail: role,
    });
  }
  window.dispatchEvent(new CustomEvent("lc-admin-role"));
}

export function getPermissions(): AdminPermissions {
  return PRESETS[getRolePreset()];
}

export function canAccessModule(mod: AdminModule): boolean {
  return getPermissions()[mod];
}

/** Works with `/admin/...` and `/[locale]/admin/...` pathnames. */
export function pathnameToAdminModule(pathname: string): AdminModule {
  const parts = pathname.split("/").filter(Boolean);
  const ai = parts.indexOf("admin");
  const next = ai >= 0 ? parts[ai + 1] : null;
  if (!next) return "dashboard";
  const map: Record<string, AdminModule> = {
    products: "products",
    orders: "orders",
    users: "users",
    payments: "payments",
    content: "content",
    settings: "settings",
    support: "support",
    seo: "seo",
  };
  return map[next] ?? "dashboard";
}

function readLogs(): ActivityLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(ACT_KEY);
    if (!s) return [];
    const p = JSON.parse(s) as ActivityLogEntry[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function getActivityLogs(): ActivityLogEntry[] {
  return readLogs().sort((a, b) => b.at.localeCompare(a.at));
}

export function appendActivityLog(
  entry: Omit<ActivityLogEntry, "id" | "at"> & { id?: string; at?: string }
): void {
  if (typeof window === "undefined") return;
  const row: ActivityLogEntry = {
    id: entry.id ?? uid(),
    at: entry.at ?? new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
  };
  const next = [row, ...readLogs()].slice(0, MAX_LOGS);
  localStorage.setItem(ACT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-admin-activity"));
}

/** Call once per tab session when admin shell mounts (demo “login”). */
export function logAdminSessionOpen(): void {
  if (typeof window === "undefined") return;
  try {
    const k = "lc_admin_session_logged_v1";
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    appendActivityLog({
      actor: "admin",
      action: "session.panel_open",
      detail: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : undefined,
    });
  } catch {
    /* ignore */
  }
}

let lastShipLog = 0;
export function saveShippingRulesWithActivity(
  next: ShippingRulesState,
  opts?: { forceLog?: boolean }
): void {
  saveShippingRules(next);
  const now = Date.now();
  if (opts?.forceLog || now - lastShipLog > 45_000) {
    lastShipLog = now;
    appendActivityLog({
      actor: "admin",
      action: "settings.shipping_rules_updated",
      detail: `${next.pinRules.length} PIN rules`,
    });
  }
}
