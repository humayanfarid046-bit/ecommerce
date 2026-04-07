/** Server + Edge: admin session cookie name and env checks. */

export const ADMIN_SESSION_COOKIE = "admin_session";

/** When set, middleware + APIs require this cookie value (opaque token from env). */
export function adminSessionTokenConfigured(): boolean {
  return Boolean(process.env.ADMIN_SESSION_TOKEN?.trim());
}

export function adminSessionMatches(cookieValue: string | undefined): boolean {
  const expected = process.env.ADMIN_SESSION_TOKEN?.trim();
  if (!expected) return true;
  return Boolean(cookieValue && cookieValue === expected);
}
