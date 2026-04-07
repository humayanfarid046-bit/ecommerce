import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { UserPaymentRecord } from "@/lib/user-payment-history";

const KEY = "entries";
const MAX = 80;

export async function loadPaymentHistoryFromFirestore(
  db: Firestore,
  uid: string
): Promise<UserPaymentRecord[] | null> {
  const ref = doc(db, "users", uid, "profile", "paymentHistory");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { [KEY]?: UserPaymentRecord[] };
  const list = data[KEY];
  return Array.isArray(list) ? list.slice(0, MAX) : [];
}

export async function savePaymentHistoryToFirestore(
  db: Firestore,
  uid: string,
  entries: UserPaymentRecord[]
): Promise<void> {
  const ref = doc(db, "users", uid, "profile", "paymentHistory");
  await setDoc(
    ref,
    { [KEY]: entries.slice(0, MAX), updatedAt: Date.now() },
    { merge: true }
  );
}
