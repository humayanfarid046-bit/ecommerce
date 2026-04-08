import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { isForcedOwnerUid } from "@/lib/owner-override";
import { resolveAccessScopeFromRecord } from "@/lib/panel-access";
import { verifyUserIdToken } from "@/lib/verify-user-token";

/**
 * Returns the caller's panel access scope by reading Firestore with the Admin SDK
 * (bypasses client-side security rules). Use when the browser cannot read
 * `users/{uid}/profile/account` but the server has `FIREBASE_SERVICE_ACCOUNT_JSON`.
 */
export async function GET(req: Request) {
  const auth = await verifyUserIdToken(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server.", fallback: true },
      { status: 503 }
    );
  }

  const snap = await db.doc(`users/${auth.uid}/profile/account`).get();
  const accessScope = resolveAccessScopeFromRecord(
    snap.data() as Record<string, unknown> | undefined
  );

  const effectiveScope =
    accessScope === "none" && isForcedOwnerUid(auth.uid) ? "owner" : accessScope;

  return NextResponse.json({ accessScope: effectiveScope });
}
