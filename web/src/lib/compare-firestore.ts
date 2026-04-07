import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";

const KEY = "productIds";
const MAX = 3;

export async function loadCompareFromFirestore(
  db: Firestore,
  uid: string
): Promise<string[] | null> {
  const ref = doc(db, "users", uid, "profile", "compare");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { [KEY]?: string[] };
  const list = data[KEY];
  return Array.isArray(list) ? list.slice(0, MAX) : [];
}

export async function saveCompareToFirestore(
  db: Firestore,
  uid: string,
  productIds: string[]
): Promise<void> {
  const ref = doc(db, "users", uid, "profile", "compare");
  await setDoc(
    ref,
    { [KEY]: productIds.slice(0, MAX), updatedAt: Date.now() },
    { merge: true }
  );
}
