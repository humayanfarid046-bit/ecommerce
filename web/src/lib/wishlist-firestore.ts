import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";

const KEY = "productIds";

export async function loadWishlistFromFirestore(
  db: Firestore,
  uid: string
): Promise<string[] | null> {
  const ref = doc(db, "users", uid, "profile", "wishlist");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { [KEY]?: string[] };
  return data[KEY] ?? [];
}

export async function saveWishlistToFirestore(
  db: Firestore,
  uid: string,
  productIds: string[]
): Promise<void> {
  const ref = doc(db, "users", uid, "profile", "wishlist");
  await setDoc(ref, { [KEY]: productIds, updatedAt: Date.now() }, { merge: true });
}
