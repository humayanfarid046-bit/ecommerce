import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { ChatMessage, SupportThread } from "@/lib/support-chat-sync";

export function safeOrderThreadId(orderId: string): string {
  return `ord_${orderId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
}

function newMsgId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

type ThreadDoc = {
  orderId: string;
  userEmail: string;
  productHint?: string;
  customerUid: string;
  messages: ChatMessage[];
  updatedAt: number;
};

function toThread(threadId: string, d: ThreadDoc): SupportThread {
  return {
    id: threadId,
    orderId: d.orderId,
    userEmail: d.userEmail,
    productHint: d.productHint,
    messages: Array.isArray(d.messages) ? d.messages : [],
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

export async function getOrCreateSupportThreadFirestore(
  db: Firestore,
  uid: string,
  orderId: string,
  userEmail: string,
  productHint?: string
): Promise<SupportThread> {
  const threadId = safeOrderThreadId(orderId);
  const ref = doc(db, "users", uid, "supportThreads", threadId);
  const snap = await getDoc(ref);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  if (!snap.exists()) {
    const firstBody = `Need help with order ${orderId}${productHint ? ` — ${productHint}` : ""}`;
    const data: ThreadDoc = {
      orderId,
      userEmail,
      productHint,
      customerUid: uid,
      messages: [
        {
          id: newMsgId(),
          at: nowIso,
          from: "user",
          body: firstBody,
        },
      ],
      updatedAt: now,
    };
    await setDoc(ref, data);
    return toThread(threadId, data);
  }
  return toThread(threadId, snap.data() as ThreadDoc);
}

export function subscribeSupportThreadFirestore(
  db: Firestore,
  uid: string,
  orderId: string,
  cb: (t: SupportThread | null) => void
): () => void {
  const threadId = safeOrderThreadId(orderId);
  const ref = doc(db, "users", uid, "supportThreads", threadId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      cb(toThread(threadId, snap.data() as ThreadDoc));
    },
    () => cb(null)
  );
}

export async function appendSupportMessageFirestore(
  db: Firestore,
  uid: string,
  threadId: string,
  from: "user" | "admin",
  body: string
): Promise<void> {
  const ref = doc(db, "users", uid, "supportThreads", threadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data() as ThreadDoc;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const msg: ChatMessage = {
    id: newMsgId(),
    at: nowIso,
    from,
    body: body.trim().slice(0, 4000),
  };
  await updateDoc(ref, {
    messages: [...(d.messages ?? []), msg],
    updatedAt: now,
  });
}
