import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { processInventoryReturn } from "@/lib/server-inventory";

export async function POST(req: Request) {
  const authz = req.headers.get("authorization") ?? "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();
  if (!adminAuth || !db) {
    return NextResponse.json(
      { error: "Server auth is not configured." },
      { status: 503 }
    );
  }
  let uid = "";
  try {
    const decoded = await adminAuth.verifyIdToken(m[1]!);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as {
    orderId?: string;
    kind?: "return" | "rto";
    disposition?: "sellable" | "damaged";
    note?: string;
    lines?: { variantId?: string; productId?: string; qty?: number }[];
  };
  if (!b.orderId || !Array.isArray(b.lines) || b.lines.length === 0) {
    return NextResponse.json(
      { error: "orderId and lines are required" },
      { status: 400 }
    );
  }

  try {
    const out = await processInventoryReturn(db, {
      orderId: b.orderId.trim(),
      userId: uid,
      actorUid: uid,
      kind: b.kind === "rto" ? "rto" : "return",
      disposition: b.disposition === "damaged" ? "damaged" : "sellable",
      note: typeof b.note === "string" ? b.note.trim() : undefined,
      lines: b.lines.map((x) => ({
        variantId: String(x.variantId ?? "").trim(),
        productId: String(x.productId ?? "").trim(),
        qty: Number(x.qty ?? 0),
      })),
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Inventory return failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
