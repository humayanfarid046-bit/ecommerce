/**
 * Upload images to Firebase Storage via Admin SDK (same credentials as Firestore).
 * Returns a Firebase download URL (token) suitable for storefront + Firestore manifest.
 */

import { randomUUID } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { getOrInitAdminApp } from "@/lib/firebase-admin";

const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function bucketName(): string | undefined {
  const n =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  return n || undefined;
}

export async function uploadCatalogImageAdmin(params: {
  buffer: Buffer;
  contentType: string;
  /** e.g. catalog/images/{adminUid}/file.jpg */
  objectPath: string;
}): Promise<string> {
  const app = getOrInitAdminApp();
  if (!app) {
    throw new Error("Firebase Admin is not configured (FIREBASE_SERVICE_ACCOUNT_JSON).");
  }
  const storage = getStorage(app);
  const name = bucketName();
  const bucket = name ? storage.bucket(name) : storage.bucket();
  const ct = params.contentType.toLowerCase().split(";")[0]!.trim();
  if (!ALLOWED.has(ct)) {
    throw new Error(`Unsupported image type: ${ct}`);
  }
  if (params.buffer.length > MAX_BYTES) {
    throw new Error(`Image too large (max ${MAX_BYTES / 1024 / 1024}MB).`);
  }

  const token = randomUUID();
  const file = bucket.file(params.objectPath);
  await file.save(params.buffer, {
    resumable: false,
    metadata: {
      contentType: ct,
      cacheControl: "public, max-age=31536000",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const encoded = encodeURIComponent(params.objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}
