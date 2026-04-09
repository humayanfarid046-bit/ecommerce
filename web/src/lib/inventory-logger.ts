import type { Firestore } from "firebase-admin/firestore";
import type { InventoryMovementType } from "@/lib/inventory-model";

const MOVEMENTS = "inventoryMovements";

function movementId(): string {
  return `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type InventoryLogInput = {
  variantId: string;
  productId: string;
  type: InventoryMovementType;
  qty: number;
  refType?: "order" | "po" | "transfer" | "manual" | "return";
  refId?: string;
  actorUid?: string;
  note?: string;
  at?: number;
};

/** Central movement logger for stock audit trail. */
export async function logInventoryMovement(
  db: Firestore,
  input: InventoryLogInput
): Promise<{ movementId: string }> {
  const id = movementId();
  await db.collection(MOVEMENTS).doc(id).set({
    movementId: id,
    variantId: input.variantId,
    productId: input.productId,
    type: input.type,
    qty: Math.max(0, Math.floor(Number(input.qty) || 0)),
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    actorUid: input.actorUid ?? null,
    note: input.note ?? null,
    at: typeof input.at === "number" ? input.at : Date.now(),
  });
  return { movementId: id };
}
