import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import {
  getServerDeliveryPolicy,
  saveServerDeliveryPolicy,
} from "@/lib/server-delivery-policy";

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "settings");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const policy = await getServerDeliveryPolicy(db);
  return NextResponse.json({ ok: true, policy });
}

export async function POST(req: Request) {
  const gate = await verifyModuleAccess(req, "settings");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    riderTokenExpiryHours?: number;
  };
  const n = Number(body.riderTokenExpiryHours);
  if (n !== 6 && n !== 12 && n !== 24) {
    return NextResponse.json(
      { error: "riderTokenExpiryHours must be one of 6, 12, 24." },
      { status: 400 }
    );
  }
  await saveServerDeliveryPolicy(
    db,
    { riderTokenExpiryHours: n as 6 | 12 | 24 },
    gate.uid
  );
  return NextResponse.json({ ok: true, policy: { riderTokenExpiryHours: n } });
}

