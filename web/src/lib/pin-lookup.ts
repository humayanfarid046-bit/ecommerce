import { lookupPinDemo } from "@/lib/india-pin-demo";

/**
 * Apply demo PIN → city/state when the user finishes typing a **new** 6-digit PIN.
 * `lastAppliedRef` prevents React Strict Mode double-runs and repeated overwrites.
 */
export function applyPinLookupIfNew(
  pinDigits: string,
  lastAppliedRef: { current: string }
): { city: string; state: string } | null {
  const d = pinDigits.replace(/\D/g, "").slice(0, 6);
  if (d.length < 6) {
    lastAppliedRef.current = "";
    return null;
  }
  if (lastAppliedRef.current === d) return null;
  const r = lookupPinDemo(d);
  if (!r) return null;
  lastAppliedRef.current = d;
  return r;
}
