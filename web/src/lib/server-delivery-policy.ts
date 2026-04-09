import type { Firestore } from "firebase-admin/firestore";

export type ServerDeliveryPolicy = {
  riderTokenExpiryHours: 6 | 12 | 24;
};

const POLICY_DOC_PATH = "systemConfig/deliveryOps";
const DEFAULT_HOURS: ServerDeliveryPolicy["riderTokenExpiryHours"] = 12;

function normalizeHours(v: unknown): ServerDeliveryPolicy["riderTokenExpiryHours"] {
  const n = Number(v);
  if (n === 6 || n === 12 || n === 24) return n;
  return DEFAULT_HOURS;
}

export function getDefaultServerDeliveryPolicy(): ServerDeliveryPolicy {
  const fromEnv = normalizeHours(process.env.DELIVERY_RIDER_TOKEN_EXPIRY_HOURS);
  return { riderTokenExpiryHours: fromEnv };
}

export async function getServerDeliveryPolicy(db: Firestore): Promise<ServerDeliveryPolicy> {
  const fallback = getDefaultServerDeliveryPolicy();
  try {
    const snap = await db.doc(POLICY_DOC_PATH).get();
    if (!snap.exists) return fallback;
    const data = snap.data() as Record<string, unknown> | undefined;
    return {
      riderTokenExpiryHours: normalizeHours(data?.riderTokenExpiryHours),
    };
  } catch {
    return fallback;
  }
}

export async function saveServerDeliveryPolicy(
  db: Firestore,
  policy: ServerDeliveryPolicy,
  actorUid?: string
): Promise<void> {
  await db.doc(POLICY_DOC_PATH).set(
    {
      riderTokenExpiryHours: normalizeHours(policy.riderTokenExpiryHours),
      updatedAt: Date.now(),
      updatedBy: actorUid ?? null,
    },
    { merge: true }
  );
}

