import type { AdminOrderRow } from "@/lib/admin-types";
import type { UserOrderRecord } from "@/lib/user-order-firestore";

/** For dashboard payment pie chart keys. */
export function methodLabelToPaymentKey(
  label: string
): "upi" | "cod" | "card" | "netbanking" {
  const m = methodLabelToPaymentMethod(label);
  if (m === "COD") return "cod";
  if (m === "NetBanking") return "netbanking";
  if (m === "Card") return "card";
  return "upi";
}

export function methodLabelToPaymentMethod(
  label: string
): AdminOrderRow["paymentMethod"] {
  const u = label.toUpperCase();
  if (u.includes("COD") || u.includes("CASH ON")) return "COD";
  if (u.includes("UPI")) return "UPI";
  if (u.includes("NET") || u.includes("BANK")) return "NetBanking";
  if (u.includes("CARD") || u.includes("RAZOR")) return "Card";
  return "UPI";
}

export function mapFirestoreStatusToAdmin(
  s: UserOrderRecord["status"]
): AdminOrderRow["status"] {
  switch (s) {
    case "placed":
    case "processing":
      return "pending";
    case "shipped":
    case "out_for_delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export function userOrderToAdminRow(
  userId: string,
  r: UserOrderRecord
): AdminOrderRow {
  const placedAt = r.placedAt || new Date(0).toISOString();
  const placedDate = placedAt.slice(0, 10);
  const titleShort = (r.itemTitle ?? "").trim().slice(0, 48);
  const customer =
    r.customerName?.trim() || titleShort || "Customer";
  const phone = r.customerPhone?.replace(/\D/g, "") ?? "";
  const method = methodLabelToPaymentMethod(r.methodLabel);
  const codPending = method === "COD";
  return {
    id: r.id,
    customer,
    customerId: userId,
    phone: phone || "—",
    amount: r.totalRupees,
    status: mapFirestoreStatusToAdmin(r.status),
    placedAt: new Date(placedAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    placedDate,
    paymentMethod: method,
    payment: codPending ? "cod_pending" : "success",
    deliveryPin: r.deliveryPin?.replace(/\D/g, "").slice(0, 6),
    riderName: r.riderName?.trim() || undefined,
    riderPhone: r.riderPhone?.trim() || undefined,
    riderToken: r.riderToken?.trim() || undefined,
    deliveryOtp: r.deliveryOtp?.trim() || undefined,
    deliveryOtpVerifiedAt: r.deliveryOtpVerifiedAt,
    cashCollectedRupees: r.cashCollectedRupees,
    lineItems: r.lineItems,
    riderTokenExpiresAt: r.riderTokenExpiresAt,
    riderTokenRevokedAt: r.riderTokenRevokedAt,
    deliveryPartnerId: r.deliveryPartnerId,
    deliveryPartnerName: r.deliveryPartnerName,
    paymentStatus: r.paymentStatus ?? (method === "COD" ? "PENDING" : "PAID"),
    deliveryAddress: r.deliveryAddress,
    rtoPendingStockIn: r.rtoPendingStockIn === true ? true : undefined,
  };
}
