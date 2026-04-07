/** Demo names/cities for live purchase toasts (replace with real events from backend). */

export const SOCIAL_PROOF_PEOPLE: { name: string; city: string }[] = [
  { name: "Sumit", city: "Kolkata" },
  { name: "Priya", city: "Mumbai" },
  { name: "Rahul", city: "Bengaluru" },
  { name: "Ananya", city: "Delhi" },
  { name: "Vikram", city: "Hyderabad" },
  { name: "Fatima", city: "Chennai" },
  { name: "Arjun", city: "Pune" },
  { name: "Meera", city: "Jaipur" },
];

export function randomMins(): number {
  return 2 + Math.floor(Math.random() * 8);
}

export function pickRandomPerson(): { name: string; city: string } {
  return SOCIAL_PROOF_PEOPLE[
    Math.floor(Math.random() * SOCIAL_PROOF_PEOPLE.length)
  ]!;
}
