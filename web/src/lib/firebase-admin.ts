/**
 * Server-only Firestore (Admin SDK). Set FIREBASE_SERVICE_ACCOUNT_JSON in production.
 */

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

export function getAdminFirestore(): Firestore | null {
  if (getApps().length) {
    return getFirestore(getApps()[0]!);
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    const cred = JSON.parse(raw) as Record<string, unknown>;
    app = initializeApp({ credential: cert(cred as Parameters<typeof cert>[0]) });
    return getFirestore(app);
  } catch {
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  if (getApps().length) {
    return getAuth(getApps()[0]!);
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    const cred = JSON.parse(raw) as Record<string, unknown>;
    app = initializeApp({ credential: cert(cred as Parameters<typeof cert>[0]) });
    return getAuth(app);
  } catch {
    return null;
  }
}
