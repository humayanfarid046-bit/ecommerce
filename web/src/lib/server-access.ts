import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { isForcedOwnerUid } from "@/lib/owner-override";
import {
  resolveAccessScopeFromRecord,
  canAccess,
  type AccessModule,
  type AccessScope,
} from "@/lib/panel-access";

type AccessResult =
  | { ok: true; uid: string; scope: AccessScope }
  | { ok: false; status: number; error: string };

export async function verifyModuleAccess(
  req: Request,
  mod: AccessModule
): Promise<AccessResult> {
  return verifyModuleAccessAny(req, [mod]);
}

/** Allow access if the user has any of the listed modules (same token verification). */
export async function verifyModuleAccessAny(
  req: Request,
  mods: AccessModule[]
): Promise<AccessResult> {
  const authz = req.headers.get("authorization") ?? "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, status: 401, error: "Unauthorized" };

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();
  if (!adminAuth || !db) {
    return { ok: false, status: 503, error: "Server auth is not configured." };
  }
  try {
    const decoded = await adminAuth.verifyIdToken(m[1]!);
    const uid = decoded.uid;
    const snap = await db.doc(`users/${uid}/profile/account`).get();
    const resolvedScope = resolveAccessScopeFromRecord(
      snap.data() as Record<string, unknown> | undefined
    );
    const scope =
      resolvedScope === "none" && isForcedOwnerUid(uid) ? "owner" : resolvedScope;
    if (!mods.some((mod) => canAccess(scope, mod))) {
      return { ok: false, status: 403, error: "Access denied" };
    }
    return { ok: true, uid, scope };
  } catch {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
}
