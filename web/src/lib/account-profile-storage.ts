import { canUseFirestoreSync, getFirebaseDb } from "@/lib/firebase/client";
import { saveProfileToFirestore } from "@/lib/profile-firestore";
import type { Gender, StoredProfile } from "@/lib/types/profile";

export type { Gender, StoredProfile } from "@/lib/types/profile";

const KEY = "libas_account_profile_v1";

/** When set, profile writes also sync to Firestore `users/{uid}/profile/account`. */
let firebaseProfileSyncUid: string | null = null;

export function setFirebaseProfileSyncUid(uid: string | null) {
  firebaseProfileSyncUid = uid;
}

const defaultProfile: StoredProfile = {
  displayName: "",
  phone: "",
  gender: "",
  dob: "",
  phoneVerified: false,
  photoDataUrl: undefined,
};

export function readProfile(): StoredProfile {
  if (typeof window === "undefined") return { ...defaultProfile };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultProfile };
    const p = JSON.parse(raw) as Partial<StoredProfile>;
    return {
      ...defaultProfile,
      ...p,
      gender: (p.gender as Gender) ?? "",
      photoDataUrl:
        typeof p.photoDataUrl === "string" && p.photoDataUrl.length > 0
          ? p.photoDataUrl
          : undefined,
    };
  } catch {
    return { ...defaultProfile };
  }
}

export function writeProfile(p: Partial<StoredProfile>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cur = readProfile();
    const next =
      p.photoDataUrl === ""
        ? { ...cur, ...p, photoDataUrl: undefined }
        : { ...cur, ...p };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("lc-profile"));
    const db = getFirebaseDb();
    if (
      db &&
      firebaseProfileSyncUid &&
      canUseFirestoreSync(firebaseProfileSyncUid)
    ) {
      saveProfileToFirestore(db, firebaseProfileSyncUid, next).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}
