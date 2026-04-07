/** Demo: remind users who left checkout (localStorage timestamps). */

const ABANDON_KEY = "libas_checkout_abandon_ts";
const REMINDED_KEY = "libas_checkout_reminded_ts";

const TEN_MIN = 10 * 60 * 1000;

export function markCheckoutEntered(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("libas_checkout_active", "1");
  } catch {
    /* ignore */
  }
}

export function markCheckoutLeftWithoutOrder(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("libas_checkout_active");
    localStorage.setItem(ABANDON_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearCheckoutRecovery(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("libas_checkout_active");
    localStorage.removeItem(ABANDON_KEY);
    localStorage.removeItem(REMINDED_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldShowAbandonReminder(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem("libas_checkout_active") === "1") return false;
    const raw = localStorage.getItem(ABANDON_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    if (Date.now() - ts < TEN_MIN) return false;
    const last = localStorage.getItem(REMINDED_KEY);
    if (last && Number(last) === ts) return false;
    return true;
  } catch {
    return false;
  }
}

export function markReminderShownForCurrentAbandon(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ABANDON_KEY);
    if (raw) localStorage.setItem(REMINDED_KEY, raw);
  } catch {
    /* ignore */
  }
}
