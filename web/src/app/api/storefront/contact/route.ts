import { NextResponse } from "next/server";
import { getStorefrontContactFromFirestore } from "@/lib/server-storefront-contact";

/** Public: support channels for Help page, WhatsApp widget, mobile drawer. */
export async function GET() {
  const contact = await getStorefrontContactFromFirestore();
  return NextResponse.json({ ok: true, contact });
}
