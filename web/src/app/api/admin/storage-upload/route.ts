import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyModuleAccess } from "@/lib/server-access";
import { uploadCatalogImageAdmin } from "@/lib/server-firebase-storage";

const DATA_URL_RE =
  /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i;

/**
 * POST JSON { dataUrl, scope?: "catalog" | "cms" } — admin-only.
 * Uploads one image to Firebase Storage; returns { url } for Firestore-safe HTTPS URLs.
 */
export async function POST(req: Request) {
  const gate = await verifyModuleAccess(req, "products");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: { dataUrl?: string; scope?: string };
  try {
    body = (await req.json()) as { dataUrl?: string; scope?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dataUrl = String(body.dataUrl ?? "").trim().replace(/\s/g, "");
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) {
    return NextResponse.json(
      { error: "Expected data:image/jpeg|png|webp|gif;base64,..." },
      { status: 400 }
    );
  }
  const contentType = m[1]!.toLowerCase();
  const b64 = m[2]!.replace(/\s/g, "");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid base64" }, { status: 400 });
  }

  const scope = body.scope === "cms" ? "cms" : "catalog";
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/gif"
          ? "gif"
          : "jpg";
  const objectPath = `${scope}/images/${gate.uid}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  try {
    const url = await uploadCatalogImageAdmin({
      buffer,
      contentType,
      objectPath,
    });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("not configured") ? 503 : 400 }
    );
  }
}
