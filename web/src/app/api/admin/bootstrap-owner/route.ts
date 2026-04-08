import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyUserIdToken } from "@/lib/verify-user-token";

export async function POST(req: Request) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_BOOTSTRAP_SECRET is not set on server." },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { secret?: string };
  if (!body.secret || body.secret !== expected) {
    return NextResponse.json({ error: "Invalid bootstrap secret." }, { status: 401 });
  }

  const auth = await verifyUserIdToken(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }

  await db
    .doc(`users/${auth.uid}/profile/account`)
    .set({ accessScope: "owner" }, { merge: true });

  return NextResponse.json({ ok: true, uid: auth.uid, accessScope: "owner" });
}
