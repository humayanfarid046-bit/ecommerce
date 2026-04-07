import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import { normalizeWalletState, type WalletState } from "@/lib/wallet-storage";
import { WALLET_DOC_ID } from "@/lib/firebase/collections";

export async function loadWalletFromFirestore(
  db: Firestore,
  uid: string
): Promise<WalletState | null> {
  const ref = doc(db, "users", uid, "wallet", WALLET_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  const balancePaise = Math.max(0, Number(d.balancePaise) || 0);
  const ledger = Array.isArray(d.ledger) ? d.ledger : [];
  return normalizeWalletState({ balancePaise, ledger });
}

export async function saveWalletToFirestore(
  db: Firestore,
  uid: string,
  state: WalletState
): Promise<void> {
  const ref = doc(db, "users", uid, "wallet", WALLET_DOC_ID);
  await setDoc(
    ref,
    {
      balancePaise: state.balancePaise,
      ledger: state.ledger.slice(0, 500),
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}
