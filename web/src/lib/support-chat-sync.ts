/** Demo order-scoped support threads (user ↔ admin). */

import { upsertTicketForOrderHelp } from "@/lib/support-review-storage";

const KEY = "lc_support_threads_v1";

export type ChatMessage = {
  id: string;
  at: string;
  from: "user" | "admin";
  body: string;
};

export type SupportThread = {
  id: string;
  orderId: string;
  userEmail: string;
  productHint?: string;
  messages: ChatMessage[];
  updatedAt: string;
};

function uid() {
  return `th_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function read(): SupportThread[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    const p = JSON.parse(s) as SupportThread[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function save(list: SupportThread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("lc-support-threads"));
}

export function getThreads(): SupportThread[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function openOrGetThread(
  orderId: string,
  userEmail: string,
  productHint?: string
): SupportThread {
  const list = read();
  let t = list.find((x) => x.orderId === orderId);
  if (t) return t;
  const now = new Date().toISOString();
  const firstBody = `Need help with order ${orderId}${productHint ? ` — ${productHint}` : ""}`;
  t = {
    id: uid(),
    orderId,
    userEmail,
    productHint,
    messages: [
      {
        id: uid(),
        at: now,
        from: "user",
        body: firstBody,
      },
    ],
    updatedAt: now,
  };
  save([t, ...list]);
  try {
    upsertTicketForOrderHelp({
      orderId,
      userEmail,
      initialBody: firstBody,
    });
  } catch {
    /* ignore */
  }
  return t;
}

export function appendMessage(threadId: string, from: "user" | "admin", body: string) {
  const list = read();
  const now = new Date().toISOString();
  const next = list.map((x) => {
    if (x.id !== threadId) return x;
    return {
      ...x,
      updatedAt: now,
      messages: [
        ...x.messages,
        { id: uid(), at: now, from, body },
      ],
    };
  });
  save(next);
}
