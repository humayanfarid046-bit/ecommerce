/**
 * Device-only saved card masks (last4 + brand) for faster checkout.
 * Not PSP tokenization — integrate Razorpay saved cards for production.
 */

export type SavedCard = {
  id: string;
  brand: "visa" | "mastercard" | "rupay";
  last4: string;
  /** Opaque id for this device-stored row (not a payment network token). */
  cardRef: string;
};

const KEY = "libas_saved_cards_v1";
const LEGACY_KEY = "libas_saved_cards_demo_v1";

function migrateLegacyOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(KEY)) {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    const out: SavedCard[] = [];
    for (const row of parsed) {
      const c = normalizeLegacyRow(row);
      if (c) out.push(c);
    }
    if (out.length) localStorage.setItem(KEY, JSON.stringify(out));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeLegacyRow(row: unknown): SavedCard | null {
  if (!isRecord(row)) return null;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const last4 = typeof row.last4 === "string" ? row.last4.trim() : "";
  const b = row.brand;
  if (
    !id ||
    !last4 ||
    (b !== "visa" && b !== "mastercard" && b !== "rupay")
  ) {
    return null;
  }
  const brand = b;
  let cardRef: string;
  if (typeof row.cardRef === "string" && row.cardRef.trim()) {
    cardRef = row.cardRef.trim();
  } else if (typeof row.token === "string" && row.token.trim()) {
    const t = row.token.trim();
    cardRef = t.startsWith("tok_demo_") ? `ref_${t.slice("tok_demo_".length)}` : t;
  } else {
    cardRef = `ref_${id}`;
  }
  return { id, brand, last4, cardRef };
}

export function readSavedCards(): SavedCard[] {
  if (typeof window === "undefined") return [];
  migrateLegacyOnce();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    const out: SavedCard[] = [];
    for (const row of p) {
      const c = normalizeLegacyRow(row);
      if (c) out.push(c);
    }
    return out;
  } catch {
    return [];
  }
}

export function writeSavedCards(cards: SavedCard[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cards));
    window.dispatchEvent(new CustomEvent("lc-saved-cards"));
  } catch {
    /* ignore */
  }
}

export function addSavedCard(
  card: Omit<SavedCard, "id" | "cardRef">
): SavedCard {
  const id = `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const cardRef = `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const full: SavedCard = { ...card, id, cardRef };
  const list = readSavedCards();
  writeSavedCards([full, ...list].slice(0, 4));
  return full;
}

export function removeSavedCard(id: string): void {
  writeSavedCards(readSavedCards().filter((c) => c.id !== id));
}
