const BAD_WORDS = [
  "fuck",
  "shit",
  "asshole",
  "bastard",
  "idiot",
  "stupid",
  "গালি",
  "খারাপ",
  "বোকা",
];

export function detectProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  for (const w of BAD_WORDS) {
    if (w.length < 2) continue;
    if (lower.includes(w.toLowerCase())) return true;
  }
  return false;
}
