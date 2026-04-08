/** Client-only support tickets, review moderation, chat (demo — replace with API). */

import { getProducts } from "@/lib/mock-data";
import { appendActivityLog } from "@/lib/admin-security-storage";

const KEY = "lc_support_review_v2";
const LEGACY_KEY = "lc_support_review_v1";
const EMPTY_TO_DEMO_FLAG = "lc_support_seeded_demo_v1";

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

/** Rich demo data so the admin Support page is usable before Firestore is wired. */
export function createDemoSupportState(): SupportState {
  const iso = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 86400000).toISOString();
  const now = new Date().toISOString();
  return {
    reviews: [
      {
        id: "demo_rev_photo",
        productId: "demo-cat-1",
        productTitle: "Embroidered kurta — demo",
        user: "Ayesha K.",
        rating: 5,
        text: "Fabric quality is excellent. Stitching neat — will order again.",
        published: true,
        featured: false,
        mediaUrls: ["https://picsum.photos/seed/reviewdemo1/400/400"],
        adminReply: "",
        moderationStatus: "ok",
        profanityFlag: false,
        rewardSent: false,
      },
      {
        id: "demo_rev_flagged",
        productId: "demo-cat-2",
        productTitle: "Silk dupatta — demo",
        user: "Guest buyer",
        rating: 2,
        text: "Colour not as shown. Disappointed with the material.",
        published: false,
        featured: false,
        mediaUrls: [],
        adminReply: "",
        moderationStatus: "pending_review",
        profanityFlag: false,
        rewardSent: false,
      },
    ],
    tickets: [
      {
        id: "demo_tk_open",
        userEmail: "customer@example.com",
        customerId: "demo-cust-1",
        subject: "Order help — ORD-DEMO-1001",
        body: "Package shows delivered but I did not receive it. Please check with courier.",
        status: "open",
        priority: "high",
        orderId: "ORD-DEMO-1001",
        internalNotes: "",
        lastCustomerReplyAt: iso(2),
        lastStaffReplyAt: null,
        createdAt: iso(3),
        staffReplies: [],
      },
      {
        id: "demo_tk_progress",
        userEmail: "riya@example.com",
        customerId: "demo-cust-2",
        subject: "Exchange size for ORD-DEMO-1002",
        body: "Need M instead of L. Same colour is fine.",
        status: "in_progress",
        priority: "medium",
        orderId: "ORD-DEMO-1002",
        internalNotes: "Check warehouse stock for M.",
        lastCustomerReplyAt: iso(0.2),
        lastStaffReplyAt: iso(0.15),
        createdAt: iso(1),
        staffReplies: [
          {
            at: iso(0.15),
            body: "Hi Riya — we’ve held an M in reserve. Please confirm your pickup address.",
          },
        ],
      },
    ],
    cannedReplies: [
      "Thank you for reaching out. We’re looking into this and will update you within 24 hours.",
      "---",
      "Your refund has been initiated; it usually reflects in 5–7 business days.",
      "---",
      "We’re sorry for the inconvenience. A replacement is being arranged at no extra cost.",
    ],
    chatConfig: {
      whatsappE164: "919876543210",
      whatsappLogs: [
        { at: now, path: "/en/cart" },
        { at: iso(0.01), path: "/bn/product/demo-cat-1" },
      ],
    },
    activeChats: [
      {
        id: "ch_1",
        customer: "Visitor · Kolkata",
        lastMessage: "Do you have this in XL?",
        handover: false,
      },
      {
        id: "ch_2",
        customer: "Logged-in user",
        lastMessage: "Wrong item received — need return label.",
        handover: true,
      },
    ],
    botScripts: [
      {
        id: "b1",
        trigger: "shipping",
        response: "We ship across India. Standard delivery is 3–5 business days.",
      },
      {
        id: "b2",
        trigger: "return",
        response: "Returns are accepted within 7 days for unused items with tags.",
      },
    ],
  };
}

export function defaultSupportState(): SupportState {
  return createDemoSupportState();
}

function read(): SupportState {
  if (typeof window === "undefined") return createDemoSupportState();
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
        raw = localStorage.getItem(KEY);
      }
    }
    if (!raw) {
      const demo = createDemoSupportState();
      localStorage.setItem(KEY, JSON.stringify(demo));
      return demo;
    }
    const p = JSON.parse(raw) as Partial<SupportState>;
    const d = createDemoSupportState();
    const merged: SupportState = {
      ...d,
      ...p,
      reviews: Array.isArray(p.reviews) ? p.reviews : d.reviews,
      tickets: Array.isArray(p.tickets) ? p.tickets : d.tickets,
      cannedReplies: Array.isArray(p.cannedReplies) ? p.cannedReplies : d.cannedReplies,
      chatConfig: {
        ...d.chatConfig,
        ...p.chatConfig,
        whatsappLogs: p.chatConfig?.whatsappLogs ?? d.chatConfig.whatsappLogs,
      },
      activeChats: Array.isArray(p.activeChats) ? p.activeChats : d.activeChats,
      botScripts: Array.isArray(p.botScripts) ? p.botScripts : d.botScripts,
    };
    const legacyEmpty =
      Array.isArray(p.reviews) &&
      p.reviews.length === 0 &&
      Array.isArray(p.tickets) &&
      p.tickets.length === 0 &&
      (!p.cannedReplies || p.cannedReplies.length === 0);
    if (legacyEmpty && !localStorage.getItem(EMPTY_TO_DEMO_FLAG)) {
      localStorage.setItem(EMPTY_TO_DEMO_FLAG, "1");
      const demo = createDemoSupportState();
      localStorage.setItem(KEY, JSON.stringify(demo));
      return demo;
    }
    return merged;
  } catch {
    return createDemoSupportState();
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
