/** Admin panel TypeScript types; live catalogue comes from `readCatalogProducts`. */

import { readCatalogProducts } from "@/lib/catalog-products-storage";

export type AdminOrderRow = {
  id: string;
  customer: string;
  /** Links to user rows / profile panel */
  customerId: string;
  phone: string;
  amount: number;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  placedAt: string;
  /** YYYY-MM-DD for date-range filters */
  placedDate: string;
  paymentMethod: "UPI" | "COD" | "Card" | "NetBanking";
  payment: "success" | "failed" | "cod_pending";
  /** Internal admin note for fulfilment */
  privateNote?: string;
  /** Delivery PIN for distance-based fee preview. */
  deliveryPin?: string;
  /** COD only — before phone confirmation; localStorage may override. */
  codConfirmationSeed?: "awaiting" | "confirmed";
  riderName?: string;
  riderPhone?: string;
  riderToken?: string;
  deliveryOtp?: string;
  deliveryOtpVerifiedAt?: number;
  cashCollectedRupees?: number;
  lineItems?: Array<{
    variantId: string;
    productId: string;
    qty: number;
  }>;
  riderTokenExpiresAt?: number;
  riderTokenRevokedAt?: number;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  paymentStatus?: "PENDING" | "PAID";
  deliveryAddress?: string;
  /** RTO marked by rider; awaiting admin Stock In to restore inventory. */
  rtoPendingStockIn?: boolean;
};

export type UserSegment = "premium" | "new" | "inactive";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  blocked: boolean;
  lastActive: string;
  /** Customer lifetime value (₹); align with orders sum when wired to your DB */
  totalSpent: number;
  segment: UserSegment;
  lastLogin: string;
  wishlistItems: string[];
  lastSearches: string[];
  walletBalance: number;
  referredByUserId?: string | null;
  referralInvites: number;
  verified: boolean;
  suspicious: boolean;
  shadowBanned: boolean;
  fraudFlags: { highCancels: boolean; otpFails: boolean };
  banReason?: string;
  /** Prior COD orders refused at door (RTO) — risk signal. */
  codRefusedCount: number;
};

export const mockBlockedIPsSeed: string[] = [];

export type AdminTransaction = {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: "success" | "failed";
  at: string;
};

export type AdminReturnReq = {
  id: string;
  userId?: string;
  orderId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  /** Customer proof image URL */
  imageProofUrl?: string;
  pickupDate?: string;
  refundMethod?: "wallet" | "bank" | null;
  processedAt?: string;
  adminNote?: string;
};

export type AdminTicket = {
  id: string;
  user: string;
  subject: string;
  status: "open" | "closed";
  updated: string;
};

export type AdminReviewMod = {
  id: string;
  product: string;
  user: string;
  rating: number;
  text: string;
  published: boolean;
};

export const adminStats = {
  ordersToday: 0,
  revenueToday: 0,
  newUsers: 0,
  visitors: 0,
};

export const adminStatsYesterday = {
  orders: 0,
  revenue: 0,
  newUsers: 0,
  visitors: 0,
};

export const sparklineOrders: number[] = [];
export const sparklineRevenue: number[] = [];
export const sparklineUsers: number[] = [];
export const sparklineVisitors: number[] = [];

/** Hourly revenue for today (populate from analytics backend). */
export const hourlySalesToday: { name: string; revenue: number }[] = [];

export function deltaVsYesterdayPercent(today: number, yesterday: number): number {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return ((today - yesterday) / yesterday) * 100;
}

export const conversionFunnel = {
  visitors: 0,
  productViews: 0,
  addToCart: 0,
  paidOrders: 0,
};

/** AOV = revenue / orders (derived for display). */
export function averageOrderValueToday(): number {
  const { revenueToday, ordersToday } = adminStats;
  if (ordersToday <= 0) return 0;
  return Math.round(revenueToday / ordersToday);
}

export const paymentMixToday = [] as readonly {
  key: "upi" | "cod" | "card" | "netbanking";
  percent: number;
  amount: number;
}[];

export const regionOrdersIndia: { regionKey: string; orders: number }[] = [];

export type LiveFeedEvent = {
  id: string;
  kind: "cart" | "wishlist" | "checkout" | "view";
  cityKey: string;
  productTitle: string;
};

export const liveFeedPool: LiveFeedEvent[] = [];

export const liveOnlineUsers = 0;

export const salesWeek: { name: string; revenue: number }[] = [];

export const salesMonth: { name: string; revenue: number }[] = [];

/** Category slugs for admin sales graph filter (must exist in catalogue). */
export const ADMIN_SALES_GRAPH_CATEGORIES = [
  "all",
  "mens-wear",
  "womens-wear",
  "kids-wear",
  "ethnic-traditional",
  "footwear-accessories",
] as const;

export type AdminSalesGraphCategoryId = (typeof ADMIN_SALES_GRAPH_CATEGORIES)[number];

export type SalesGraphPoint = {
  name: string;
  revenue: number;
  orders: number;
  views: number;
  revenuePrev: number;
  ordersPrev: number;
  viewsPrev: number;
};

/**
 * Sales graph series — zeros until a real analytics source is connected.
 */
export function getSalesGraphData(
  _categoryId: AdminSalesGraphCategoryId,
  period: "week" | "month"
): SalesGraphPoint[] {
  const labels =
    period === "week"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["W1", "W2", "W3", "W4"];
  return labels.map((name) => ({
    name,
    revenue: 0,
    orders: 0,
    views: 0,
    revenuePrev: 0,
    ordersPrev: 0,
    viewsPrev: 0,
  }));
}

/** Default low-stock alert threshold by price. */
export function defaultStockThreshold(price: number): number {
  if (price >= 15_000) return 2;
  if (price >= 5_000) return 5;
  if (price >= 1_500) return 10;
  return 15;
}

function estimatedWeeklySalesUnits(): number {
  return 0;
}

export type LowStockActionRow = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  categorySlug: string;
  price: number;
  stock: number;
  threshold: number;
  weeklySalesUnits: number;
  /** Internal ops / warehouse contact for low-stock alerts */
  opsContactEmail: string;
};

export function getLowStockActionRows(): LowStockActionRow[] {
  const products = readCatalogProducts();
  const rows: LowStockActionRow[] = products.map((p) => {
    const n = parseInt(p.id.replace(/\D/g, ""), 10);
    const fallback = Number.isFinite(n) ? (n % 8) + 1 : 4;
    const stock = p.stockLeft ?? fallback;
    const threshold = defaultStockThreshold(p.price);
    const opsContactEmail = "";
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      categorySlug: p.categorySlug,
      price: p.price,
      stock,
      threshold,
      weeklySalesUnits: estimatedWeeklySalesUnits(),
      opsContactEmail,
    };
  });

  const needAttention = rows.filter((r) => r.stock <= r.threshold);
  const list = needAttention.length ? needAttention : [...rows].sort((a, b) => a.stock - b.stock).slice(0, 12);
  return [...list].sort((a, b) => a.stock - b.stock);
}

export function predictDaysUntilStockout(
  stock: number,
  weeklySalesUnits: number
): number | null {
  if (stock <= 0) return 0;
  if (weeklySalesUnits <= 0) return null;
  const daily = weeklySalesUnits / 7;
  return Math.max(1, Math.ceil(stock / daily));
}

export type StockSeverity = "out" | "critical" | "warning" | "ok";

export function getStockSeverity(stock: number): StockSeverity {
  if (stock <= 0) return "out";
  if (stock <= 2) return "critical";
  if (stock <= 10) return "warning";
  return "ok";
}

export function getLowStockProducts() {
  const products = readCatalogProducts();
  const mapped = products.map((p) => {
    const n = parseInt(p.id.replace(/\D/g, ""), 10);
    const fallback = Number.isFinite(n) ? (n % 8) + 1 : 4;
    return {
      id: p.id,
      title: p.title,
      brand: p.brand,
      stock: p.stockLeft ?? fallback,
      price: p.price,
    };
  });
  const low = mapped.filter((p) => p.stock < 15);
  const list = low.length ? low : mapped;
  return [...list].sort((a, b) => a.stock - b.stock).slice(0, 10);
}

export const mockAdminOrders: AdminOrderRow[] = [];

export function ordersForCustomer(
  customerId: string,
  allOrders: AdminOrderRow[] = mockAdminOrders
): AdminOrderRow[] {
  return allOrders.filter((o) => o.customerId === customerId);
}

export function totalSpentForCustomer(
  customerId: string,
  allOrders: AdminOrderRow[] = mockAdminOrders
): number {
  return ordersForCustomer(customerId, allOrders).reduce((s, o) => s + o.amount, 0);
}

export const mockUsers: AdminUserRow[] = [];

export const mockTransactions: AdminTransaction[] = [];

export const mockPayouts: {
  id: string;
  label: string;
  amount: number;
  status: string;
  date: string;
}[] = [];

export type CodRemittanceRow = {
  id: string;
  courier: string;
  amount: number;
  status: "pending" | "received";
  dueDate: string;
};

export type RiderCashRow = {
  id: string;
  name: string;
  pendingCash: number;
  todayCollected: number;
  settled: boolean;
};

export const mockCodCashSummary = {
  todayDeliveredCod: 0,
  cashInHand: 0,
};

export const mockCodRemittance: CodRemittanceRow[] = [];

export const mockRiderCash: RiderCashRow[] = [];

export const mockReturns: AdminReturnReq[] = [];

export const mockTickets: AdminTicket[] = [];

export const mockReviewsMod: AdminReviewMod[] = [];

export const mockActivityLogs: { who: string; action: string; at: string }[] = [];

export const wishlistBehaviorMetrics: {
  product: string;
  views: number;
  wishlistAdds: number;
  purchases: number;
}[] = [];
