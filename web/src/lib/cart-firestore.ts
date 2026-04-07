import {
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { CartItem } from "@/lib/cart-types";

const CART_KEY = "items";

export async function loadCartFromFirestore(
  db: Firestore,
  uid: string
): Promise<CartItem[] | null> {
  const ref = doc(db, "users", uid, "profile", "cart");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { [CART_KEY]?: CartItem[] };
  return data[CART_KEY] ?? [];
}

export async function saveCartToFirestore(
  db: Firestore,
  uid: string,
  items: CartItem[]
): Promise<void> {
  const ref = doc(db, "users", uid, "profile", "cart");
  await setDoc(ref, { [CART_KEY]: items, updatedAt: Date.now() }, { merge: true });
}
