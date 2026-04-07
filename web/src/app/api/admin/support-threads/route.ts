import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";

type Msg = { id: string; at: string; from: "user" | "admin"; body: string };

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "support");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ threads: [] }, { status: 503 });
  }
  try {
    const snap = await db.collectionGroup("supportThreads").limit(200).get();
    const rows = snap.docs.map((d) => {
      const x = d.data() as Record<string, unknown>;
      const path = d.ref.path.split("/");
      const userId = path[1] ?? "";
      return {
        threadId: d.id,
        userId,
        orderId: typeof x.orderId === "string" ? x.orderId : "",
        userEmail: typeof x.userEmail === "string" ? x.userEmail : "",
        productHint: typeof x.productHint === "string" ? x.productHint : "",
        messages: Array.isArray(x.messages) ? (x.messages as Msg[]) : [],
        updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : 0,
      };
    });
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return NextResponse.json({ threads: rows.slice(0, 100) });
  } catch {
    return NextResponse.json({ threads: [] }, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  const gate = await verifyModuleAccess(req, "support");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const body = (await req.json()) as {
    userId?: string;
    threadId?: string;
    body?: string;
  };
  const userId = body.userId?.trim();
  const threadId = body.threadId?.trim();
  const text = body.body?.trim();
  if (!userId || !threadId || !text) {
    return NextResponse.json({ error: "userId, threadId, body required" }, { status: 400 });
  }
  const ref = db.doc(`users/${userId}/supportThreads/${threadId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const d = snap.data() as { messages?: Msg[]; updatedAt?: number };
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const msg: Msg = {
    id: `adm_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: nowIso,
    from: "admin",
    body: text.slice(0, 4000),
  };
  await ref.set(
    {
      messages: [...(d.messages ?? []), msg],
      updatedAt: now,
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}
