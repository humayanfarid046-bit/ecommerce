/**
 * Optional list for live purchase toasts — populate from analytics / API when available.
 * Empty = no rotating toasts.
 */
export const SOCIAL_PROOF_PEOPLE: { name: string; city: string }[] = [];

export function randomMins(): number {
  return 2 + Math.floor(Math.random() * 8);
}

export function pickRandomPerson(): { name: string; city: string } | null {
  if (!SOCIAL_PROOF_PEOPLE.length) return null;
  return SOCIAL_PROOF_PEOPLE[
    Math.floor(Math.random() * SOCIAL_PROOF_PEOPLE.length)
  ]!;
}
