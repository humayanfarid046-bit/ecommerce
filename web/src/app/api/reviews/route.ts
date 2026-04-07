import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyUserIdToken } from "@/lib/verify-user-token";
import { detectProfanity } from "@/lib/profanity-lite";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ reviews: [] }, { status: 503 });
  }
  try {
    const snap = await db
      .collectionGroup("productReviews")
      .where("productId", "==", productId)
      .where("status", "==", "published")
      .get();
    const reviews = snap.docs.map((d) => {
      const x = d.data() as Record<string, unknown>;
      const path = d.ref.path.split("/");
      const userId = path[1] ?? "";
      return {
        id: d.id,
        userId,
        userName: typeof x.userName === "string" ? x.userName : "Customer",
        rating: typeof x.rating === "number" ? x.rating : 0,
        text: typeof x.text === "string" ? x.text : "",
        date:
          typeof x.publishedAt === "string"
            ? x.publishedAt.slice(0, 10)
            : typeof x.createdAt === "number"
              ? new Date(x.createdAt).toISOString().slice(0, 10)
              : "",
        images: Array.isArray(x.imageUrls) ? (x.imageUrls as string[]) : [],
        verifiedPurchase: x.verifiedPurchase === true,
        adminReply: typeof x.adminReply === "string" ? x.adminReply : "",
      };
    });
    reviews.sort((a, b) => (a.date < b.date ? 1 : -1));
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const gate = await verifyUserIdToken(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const body = (await req.json()) as {
    productId?: string;
    productTitle?: string;
    rating?: number;
    text?: string;
    imageUrls?: string[];
  };
  const productId = body.productId?.trim();
  const productTitle = body.productTitle?.trim() ?? "";
  const text = body.text?.trim() ?? "";
  const rating = Number(body.rating);
  if (!productId || text.length < 3) {
    return NextResponse.json({ error: "productId and text are required" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  const images = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string" && u.length < 12000).slice(0, 3)
    : [];
  const bad = detectProfanity(text);
  const uid = gate.uid;
  const ref = db.collection(`users/${uid}/productReviews`).doc();
  const now = Date.now();
  const userSnap = await db.doc(`users/${uid}/profile/account`).get();
  const prof = userSnap.data() as { displayName?: string } | undefined;
  const userName =
    typeof prof?.displayName === "string" && prof.displayName.trim()
      ? prof.displayName.trim()
      : "Customer";
  const published = !bad;
  const iso = new Date(now).toISOString();
  await ref.set({
    userId: uid,
    userName,
    productId,
    productTitle,
    rating,
    text,
    imageUrls: images,
    status: published ? "published" : "pending",
    profanityFlag: bad,
    moderationStatus: published ? "ok" : "pending_review",
    createdAt: now,
    publishedAt: published ? iso : "",
    verifiedPurchase: false,
    adminReply: "",
    featured: false,
  });
  return NextResponse.json({ ok: true, id: ref.id });
}
