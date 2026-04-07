import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import { sanitizeGender, type StoredProfile } from "@/lib/types/profile";
import { PROFILE_SEGMENT } from "@/lib/firebase/collections";

export async function loadProfileFromFirestore(
  db: Firestore,
  uid: string
): Promise<Partial<StoredProfile> | null> {
  const ref = doc(db, "users", uid, "profile", PROFILE_SEGMENT);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    displayName: typeof d.displayName === "string" ? d.displayName : "",
    phone: typeof d.phone === "string" ? d.phone : "",
    gender: sanitizeGender(d.gender),
    dob: typeof d.dob === "string" ? d.dob : "",
    phoneVerified: Boolean(d.phoneVerified),
    photoDataUrl:
      typeof d.photoDataUrl === "string" && d.photoDataUrl.length > 0
        ? d.photoDataUrl
        : undefined,
  };
}

/** Large data URLs can approach Firestore 1MB doc limit — production: use Storage URLs. */
export async function saveProfileToFirestore(
  db: Firestore,
  uid: string,
  profile: Partial<StoredProfile>
): Promise<void> {
  const ref = doc(db, "users", uid, "profile", PROFILE_SEGMENT);
  const payload: Record<string, unknown> = {
    updatedAt: Date.now(),
  };
  if (profile.displayName !== undefined) payload.displayName = profile.displayName;
  if (profile.phone !== undefined) payload.phone = profile.phone;
  if (profile.gender !== undefined) payload.gender = profile.gender;
  if (profile.dob !== undefined) payload.dob = profile.dob;
  if (profile.phoneVerified !== undefined)
    payload.phoneVerified = profile.phoneVerified;
  if (profile.photoDataUrl !== undefined) {
    payload.photoDataUrl =
      profile.photoDataUrl === "" ? null : profile.photoDataUrl;
  }
  await setDoc(ref, payload, { merge: true });
}
