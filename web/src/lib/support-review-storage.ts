/** Client-only support tickets, review moderation, chat (demo — replace with API). */

import { getProducts } from "@/lib/mock-data";
import { appendActivityLog } from "@/lib/admin-security-storage";

const KEY = "lc_support_review_v1";

export type ReviewModeration = {
  id: string;
  productId: string;
  productTitle: string;
  user: string;
  rating: number;
  text: string;
  published: boolean;
  featured: boolean;
  mediaUrls: string[];
  videoUrl?: string;
  adminReply: string;
  moderationStatus: "ok" | "pending_review" | "blocked";
  profanityFlag: boolean;
  rewardSent?: boolean;
};

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "high" | "medium" | "low";

export type TicketStaffReply = { body: string; at: string };

export type SupportTicket = {
  id: string;
  userEmail: string;
  customerId: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  orderId: string | null;
  internalNotes: string;
  lastCustomerReplyAt: string;
  lastStaffReplyAt: string | null;
  createdAt: string;
  /** Admin replies sent from the ticket panel (persisted). */
  staffReplies?: TicketStaffReply[];
};

export type ChatConfig = {
  whatsappE164: string;
  /** Demo clicks from storefront widget */
  whatsappLogs: { at: string; path?: string }[];
};

export type ActiveChatSession = {
  id: string;
  customer: string;
  lastMessage: string;
  handover: boolean;
};

export type BotScript = {
  id: string;
  trigger: string;
  response: string;
};

export type SupportState = {
  reviews: ReviewModeration[];
  tickets: SupportTicket[];
  cannedReplies: string[];
  chatConfig: ChatConfig;
  activeChats: ActiveChatSession[];
  botScripts: BotScript[];
};

import { detectProfanity as detectProfanityLite } from "@/lib/profanity-lite";

export function detectProfanity(text: string): boolean {
  return detectProfanityLite(text);
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultSupportState(): SupportState {
  return {
    reviews: [],
    tickets: [],
    cannedReplies: [],
    chatConfig: {
      whatsappE164: "",
      whatsappLogs: [],
    },
    activeChats: [],
    botScripts: [],
  };
}

function read(): SupportState {
  if (typeof window === "undefined") return defaultSupportState();
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return defaultSupportState();
    const p = JSON.parse(s) as Partial<SupportState>;
    const d = defaultSupportState();
    return {
      ...d,
      ...p,
      reviews: Array.isArray(p.reviews) ? p.reviews : d.reviews,
      tickets: Array.isArray(p.tickets) ? p.tickets : d.tickets,
      cannedReplies: Array.isArray(p.cannedReplies) ? p.cannedReplies : d.cannedReplies,
      chatConfig: { ...d.chatConfig, ...p.chatConfig, whatsappLogs: p.chatConfig?.whatsappLogs ?? d.chatConfig.whatsappLogs },
      activeChats: Array.isArray(p.activeChats) ? p.activeChats : d.activeChats,
      botScripts: Array.isArray(p.botScripts) ? p.botScripts : d.botScripts,
    };
  } catch {
    return defaultSupportState();
  }
}

export function getSupportState(): SupportState {
  return read();
}

export function saveSupportState(next: SupportState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-support"));
}

export function dispatchSupportEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lc-support"));
}

/** Apply profanity rules to a review (call before save). */
export function applyReviewModeration(r: ReviewModeration): ReviewModeration {
  const bad = detectProfanity(r.text);
  if (!bad) {
    return {
      ...r,
      profanityFlag: false,
      moderationStatus: r.moderationStatus === "blocked" ? r.moderationStatus : "ok",
    };
  }
  return {
    ...r,
    profanityFlag: true,
    published: false,
    featured: false,
    moderationStatus: "pending_review",
  };
}

export function getFeaturedReviewsForHome(limit = 4): ReviewModeration[] {
  return getSupportState()
    .reviews.filter(
      (r) => r.featured && r.published && r.moderationStatus !== "pending_review"
    )
    .slice(0, limit);
}

export type LowRatingProduct = {
  productId: string;
  title: string;
  avgRating: number;
  reviewCount: number;
};

export function getLowRatingProducts(maxRating = 3): LowRatingProduct[] {
  return getProducts()
    .filter((p) => p.rating < maxRating && p.reviewCount > 0)
    .map((p) => ({
      productId: p.id,
      title: p.title,
      avgRating: p.rating,
      reviewCount: p.reviewCount,
    }))
    .sort((a, b) => a.avgRating - b.avgRating);
}

/** When no catalogue item is &lt; maxRating, returns lowest-rated products for visibility (demo). */
export function getLowestRatedProductsFallback(limit = 5): LowRatingProduct[] {
  return [...getProducts()]
    .filter((p) => p.reviewCount > 0)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, limit)
    .map((p) => ({
      productId: p.id,
      title: p.title,
      avgRating: p.rating,
      reviewCount: p.reviewCount,
    }));
}

export function isTicketSlaBreached(t: SupportTicket): boolean {
  if (t.status === "resolved") return false;
  const waitStart = new Date(t.lastCustomerReplyAt).getTime();
  const staff = t.lastStaffReplyAt ? new Date(t.lastStaffReplyAt).getTime() : 0;
  if (staff >= waitStart) return false;
  return Date.now() - waitStart > 24 * 3600000;
}

export function logWhatsAppClick(path?: string): void {
  const state = getSupportState();
  const next: SupportState = {
    ...state,
    chatConfig: {
      ...state.chatConfig,
      whatsappLogs: [
        { at: new Date().toISOString(), path },
        ...state.chatConfig.whatsappLogs,
      ].slice(0, 200),
    },
  };
  saveSupportState(next);
}

/** When a user opens “Need help” on an order, mirror a row in admin support (same browser). */
export function upsertTicketForOrderHelp(input: {
  orderId: string;
  userEmail: string;
  customerId?: string;
  initialBody: string;
}): void {
  if (typeof window === "undefined") return;
  const state = getSupportState();
  const dup = state.tickets.some(
    (t) => t.orderId === input.orderId && t.subject.startsWith("Order help")
  );
  if (dup) return;
  const now = new Date().toISOString();
  const tk: SupportTicket = {
    id: uid("tk"),
    userEmail: input.userEmail,
    customerId: input.customerId ?? "guest",
    subject: `Order help — ${input.orderId}`,
    body: input.initialBody,
    status: "open",
    priority: "medium",
    orderId: input.orderId,
    internalNotes: "",
    lastCustomerReplyAt: now,
    lastStaffReplyAt: null,
    createdAt: now,
    staffReplies: [],
  };
  saveSupportState({ ...state, tickets: [tk, ...state.tickets] });
}

export function sendReviewReward(reviewId: string, points: number): void {
  const state = getSupportState();
  const next = {
    ...state,
    reviews: state.reviews.map((r) =>
      r.id === reviewId ? { ...r, rewardSent: true } : r
    ),
  };
  saveSupportState(next);
  appendActivityLog({
    actor: "admin",
    action: "review.reward_sent",
    detail: `${reviewId} · +${points} pts`,
  });
}

export { uid };
