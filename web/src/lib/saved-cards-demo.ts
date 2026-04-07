/** Demo “tokenized” saved cards (localStorage — not PCI compliant). */

export type SavedCardDemo = {
  id: string;
  brand: "visa" | "mastercard" | "rupay";
  last4: string;
  /** Fake token reference */
  token: string;
};

const KEY = "libas_saved_cards_demo_v1";

export function readSavedCards(): SavedCardDemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as SavedCardDemo[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function writeSavedCards(cards: SavedCardDemo[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cards));
    window.dispatchEvent(new CustomEvent("lc-saved-cards"));
  } catch {
    /* ignore */
  }
}

export function addSavedCardDemo(card: Omit<SavedCardDemo, "id" | "token">): SavedCardDemo {
  const id = `card_${Date.now().toString(36)}`;
  const token = `tok_demo_${Math.random().toString(36).slice(2, 10)}`;
  const full: SavedCardDemo = { ...card, id, token };
  const list = readSavedCards();
  writeSavedCards([full, ...list].slice(0, 4));
  return full;
}
