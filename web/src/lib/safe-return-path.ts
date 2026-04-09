/** Internal path only — blocks open redirects. */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("://")) return null;
  return s;
}
