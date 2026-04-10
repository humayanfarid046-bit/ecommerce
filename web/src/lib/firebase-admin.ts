/**
 * Server-only Firebase Admin (Firestore, Auth, Storage).
 * Set FIREBASE_SERVICE_ACCOUNT_JSON in production.
 */

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export function getOrInitAdminApp(): App | null {
  if (getApps().length) {
    return getApps()[0]!;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    const cred = JSON.parse(raw) as Record<string, unknown>;
    return initializeApp({
      credential: cert(cred as Parameters<typeof cert>[0]),
    });
  } catch {
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  const app = getOrInitAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth(): Auth | null {
  const app = getOrInitAdminApp();
  return app ? getAuth(app) : null;
}
