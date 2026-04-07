import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

export async function createUserReturnRequest(
  db: Firestore,
  uid: string,
  input: { orderId: string; reason: string; imageProofUrl?: string }
): Promise<string> {
  const returnId = `ret_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  await setDoc(doc(db, "users", uid, "returns", returnId), {
    orderId: input.orderId,
    reason: input.reason.trim().slice(0, 2000),
    status: "pending",
    createdAt: serverTimestamp(),
    imageProofUrl: input.imageProofUrl?.trim().slice(0, 8000) ?? "",
    userId: uid,
  });
  return returnId;
}
