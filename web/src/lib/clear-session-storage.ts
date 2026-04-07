/** Clear client-side session data (demo auth, profile, prefs). Keeps theme + NEXT_LOCALE-style keys if present. */

export function clearAllSessionsExceptTheme(): void {
  if (typeof window === "undefined") return;
  try {
    const theme = localStorage.getItem("libas_theme_mode");
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith("libas_") || k.startsWith("ecom_")) {
        if (k !== "libas_theme_mode") {
          localStorage.removeItem(k);
        }
      }
    }
    if (theme) localStorage.setItem("libas_theme_mode", theme);
  } catch {
    /* ignore */
  }
}
