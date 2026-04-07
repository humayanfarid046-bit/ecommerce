import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { SavedAddress } from "@/lib/saved-address";

const KEY = "list";

export async function loadAddressesFromFirestore(
  db: Firestore,
  uid: string
): Promise<SavedAddress[] | null> {
  const ref = doc(db, "users", uid, "profile", "addresses");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { [KEY]?: SavedAddress[] };
  return data[KEY] ?? [];
}

export async function saveAddressesToFirestore(
  db: Firestore,
  uid: string,
  list: SavedAddress[]
): Promise<void> {
  const ref = doc(db, "users", uid, "profile", "addresses");
  await setDoc(ref, { [KEY]: list, updatedAt: Date.now() }, { merge: true });
}
