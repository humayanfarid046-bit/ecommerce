import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";
import {
  getStorefrontContactFromFirestore,
  saveStorefrontContactToFirestore,
} from "@/lib/server-storefront-contact";
import type { StorefrontContact } from "@/lib/storefront-contact-types";

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "support");
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
  const contact = await getStorefrontContactFromFirestore();
  return NextResponse.json({ ok: true, contact });
}

export async function POST(req: Request) {
  const gate = await verifyModuleAccess(req, "support");
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
  const body = (await req.json().catch(() => ({}))) as Partial<StorefrontContact>;
  const phone = body.supportPhoneE164;
  const email = body.supportEmail;
  const wa = body.whatsappE164;
  if (
    phone !== undefined &&
    typeof phone !== "string"
  ) {
    return NextResponse.json({ error: "supportPhoneE164 must be a string." }, { status: 400 });
  }
  if (email !== undefined && typeof email !== "string") {
    return NextResponse.json({ error: "supportEmail must be a string." }, { status: 400 });
  }
  if (wa !== undefined && typeof wa !== "string") {
    return NextResponse.json({ error: "whatsappE164 must be a string." }, { status: 400 });
  }
  if (
    email !== undefined &&
    email.trim().length > 0 &&
    !email.includes("@")
  ) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  const contact = await saveStorefrontContactToFirestore(
    db,
    {
      ...(phone !== undefined ? { supportPhoneE164: phone } : {}),
      ...(email !== undefined ? { supportEmail: email } : {}),
      ...(wa !== undefined ? { whatsappE164: wa } : {}),
    },
    gate.uid
  );
  return NextResponse.json({ ok: true, contact });
}
