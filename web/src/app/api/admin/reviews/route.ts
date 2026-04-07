import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess } from "@/lib/server-access";

function mapPendingReviewDoc(d: QueryDocumentSnapshot) {
  const x = d.data() as Record<string, unknown>;
  const path = d.ref.path.split("/");
  const userId = path[1] ?? "";
  return {
    id: d.id,
    userId,
    productId: typeof x.productId === "string" ? x.productId : "",
    productTitle: typeof x.productTitle === "string" ? x.productTitle : "",
    userName: typeof x.userName === "string" ? x.userName : "Customer",
    rating: typeof x.rating === "number" ? x.rating : 0,
    text: typeof x.text === "string" ? x.text : "",
    profanityFlag: x.profanityFlag === true,
    imageUrls: Array.isArray(x.imageUrls) ? (x.imageUrls as string[]) : [],
    createdAt: typeof x.createdAt === "number" ? x.createdAt : 0,
  };
}

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "support");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ reviews: [] }, { status: 503 });
  }

  try {
    let docs: QueryDocumentSnapshot[];
    try {
      const snap = await db
        .collectionGroup("productReviews")
        .where("status", "==", "pending")
        .limit(200)
        .get();
      docs = snap.docs;
    } catch {
      const all = await db.collectionGroup("productReviews").limit(500).get();
      docs = all.docs.filter((d) => (d.data() as { status?: string }).status === "pending").slice(0, 200);
    }
    const rows = docs.map((d) => mapPendingReviewDoc(d));
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ reviews: rows });
  } catch {
    return NextResponse.json({ reviews: [] }, { status: 200 });
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
    reviewId?: string;
    action?: "publish" | "block";
    adminReply?: string;
    featured?: boolean;
  };
  const userId = body.userId?.trim();
  const reviewId = body.reviewId?.trim();
  if (!userId || !reviewId || !body.action) {
    return NextResponse.json({ error: "userId, reviewId, action required" }, { status: 400 });
  }
  const ref = db.doc(`users/${userId}/productReviews/${reviewId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const now = Date.now();
  const iso = new Date(now).toISOString();
  if (body.action === "publish") {
    await ref.set(
      {
        status: "published",
        moderationStatus: "ok",
        publishedAt: iso,
        profanityFlag: false,
        adminReply: typeof body.adminReply === "string" ? body.adminReply : "",
        featured: body.featured === true,
      },
      { merge: true }
    );
  } else {
    await ref.set(
      {
        status: "blocked",
        moderationStatus: "blocked",
        publishedAt: "",
        adminReply: typeof body.adminReply === "string" ? body.adminReply : "",
        featured: false,
      },
      { merge: true }
    );
  }
  return NextResponse.json({ ok: true });
}
