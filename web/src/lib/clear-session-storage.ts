/** Clear client-side session data (demo auth, profile, prefs). */

export function clearLibasSessionLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith("libas_") || k.startsWith("ecom_")) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}
