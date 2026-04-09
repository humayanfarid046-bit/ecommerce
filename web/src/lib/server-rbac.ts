import type { Firestore } from "firebase-admin/firestore";
import { normalizeAppRole, type AppRole } from "@/lib/rbac";

export async function getUserRole(db: Firestore, uid: string): Promise<AppRole> {
  try {
    const snap = await db.doc(`users/${uid}/profile/account`).get();
    const data = snap.data() as Record<string, unknown> | undefined;
    const role = normalizeAppRole(data?.role);
    if (role !== "CUSTOMER") return role;
    const scope = String(data?.accessScope ?? "").toLowerCase();
    if (scope === "owner" || scope === "operations" || scope === "catalog") {
      return "ADMIN";
    }
    return "CUSTOMER";
  } catch {
    return "CUSTOMER";
  }
}

