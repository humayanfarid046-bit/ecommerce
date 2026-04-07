/**
 * Demo PIN → city/state by first 3 digits (expand or swap for India Post / postal API).
 * Browser “Use my location” is not wired; `/api/reverse-geocode` exists for lat/lon if you add a map later.
 */

const PREFIX_MAP: Record<
  string,
  { city: string; state: string }
> = {
  "110": { city: "New Delhi", state: "Delhi" },
  "122": { city: "Gurugram", state: "Haryana" },
  "201": { city: "Noida", state: "Uttar Pradesh" },
  "400": { city: "Mumbai", state: "Maharashtra" },
  "560": { city: "Bengaluru", state: "Karnataka" },
  "700": { city: "Kolkata", state: "West Bengal" },
  "600": { city: "Chennai", state: "Tamil Nadu" },
  "500": { city: "Hyderabad", state: "Telangana" },
  "380": { city: "Ahmedabad", state: "Gujarat" },
  "395": { city: "Surat", state: "Gujarat" },
  "411": { city: "Pune", state: "Maharashtra" },
  "682": { city: "Kochi", state: "Kerala" },
  "302": { city: "Jaipur", state: "Rajasthan" },
  "751": { city: "Bhubaneswar", state: "Odisha" },
};

export function lookupPinDemo(pin: string): { city: string; state: string } | null {
  const d = pin.replace(/\D/g, "").slice(0, 6);
  if (d.length < 3) return null;
  const prefix3 = d.slice(0, 3);
  if (PREFIX_MAP[prefix3]) return PREFIX_MAP[prefix3];
  const prefix2 = d.slice(0, 2);
  const fallback = Object.keys(PREFIX_MAP).find((k) => k.startsWith(prefix2));
  return fallback ? PREFIX_MAP[fallback]! : { city: "Metro City", state: "India" };
}
