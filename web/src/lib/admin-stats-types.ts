export type PaymentMixRow = {
  key: "upi" | "cod" | "card" | "netbanking";
  percent: number;
  amount: number;
};

export type RegionOrderRow = { regionKey: string; orders: number };

export type AdminStatsPayload = {
  ordersToday: number;
  revenueToday: number;
  ordersYesterday: number;
  revenueYesterday: number;
  totalOrders: number;
  newUsersToday: number;
  paymentMix: PaymentMixRow[];
  regionOrders: RegionOrderRow[];
  hourlyToday: { name: string; revenue: number }[];
};
