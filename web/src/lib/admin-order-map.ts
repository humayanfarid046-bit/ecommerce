import type { AdminOrderRow } from "@/lib/admin-mock-data";
import type { UserOrderRecord } from "@/lib/user-order-firestore";

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
  };
}
