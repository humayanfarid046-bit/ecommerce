export type Gender = "" | "male" | "female" | "other" | "prefer_not";

const GENDERS = new Set<string>(["", "male", "female", "other", "prefer_not"]);

/** Firestore/JSON may contain invalid strings — keep UI and writes safe. */
export function sanitizeGender(g: unknown): Gender {
  if (typeof g === "string" && GENDERS.has(g)) return g as Gender;
  return "";
}

export type StoredProfile = {
  displayName: string;
  phone: string;
  gender: Gender;
  dob: string;
  phoneVerified: boolean;
  /** JPEG/PNG data URL — prefer Storage URLs in production. */
  photoDataUrl?: string;
};
