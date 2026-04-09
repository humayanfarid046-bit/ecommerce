export type InventoryVariant = {
  variantId: string;
  productId: string;
  sku: string;
  title: string;
  onHand: number;
  /** Non-sellable returned/damaged units kept isolated from sellable stock. */
  quarantineQty?: number;
  reserved: number;
  reorderLevel: number;
  reorderQty: number;
  warehouseId: string;
  binId?: string;
  avgCostRupees?: number;
  updatedAt: number;
};

export type InventoryMovementType =
  | "adjust_in"
  | "adjust_out"
  | "reserve"
  | "release"
  | "commit"
  | "return_receive"
  | "rto_receive"
  | "receive"
  | "transfer_out"
  | "transfer_in";

export type InventoryMovement = {
  movementId: string;
  variantId: string;
  productId: string;
  type: InventoryMovementType;
  qty: number;
  refType?: "order" | "po" | "transfer" | "manual" | "return";
  refId?: string;
  actorUid?: string;
  note?: string;
  at: number;
};

export type InventoryReservation = {
  reservationId: string;
  orderId: string;
  userId: string;
  status: "active" | "released" | "committed" | "expired";
  lines: { variantId: string; qty: number; productId: string }[];
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
};

export type PurchaseOrder = {
  poId: string;
  status: "draft" | "ordered" | "partially_received" | "received" | "cancelled";
  lines: { variantId: string; productId: string; qty: number; costRupees: number }[];
  expectedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type StockTransfer = {
  transferId: string;
  status: "requested" | "in_transit" | "received";
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: { variantId: string; productId: string; qty: number }[];
  createdAt: number;
  updatedAt: number;
};
