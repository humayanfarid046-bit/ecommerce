/**
 * Only **misleading / fake** admin actions (courier demo, bulk demo, fake campaign stat bump)
 * are gated in production. Catalog, CMS, support, coupons, wallet tools stay usable.
 *
 * Set NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES=true to show those fake buttons in production.
 */
export function misleadingDemoActionsEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES === "true";
}

/** @deprecated Use misleadingDemoActionsEnabled — name kept for a few call sites */
export function demoAdminFeaturesEnabled(): boolean {
  return misleadingDemoActionsEnabled();
}

export function ensureMisleadingDemoAllowed(): boolean {
  return misleadingDemoActionsEnabled();
}
