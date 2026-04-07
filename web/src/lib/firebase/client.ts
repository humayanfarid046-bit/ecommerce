import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim());
}

/**
 * Matches Firebase Console → Web app config. Auth + Firestore use this today.
 * In-app bell notifications are local (notifications-storage), not FCM.
 * Keep `messagingSenderId` for the same snippet; needed if you add web push / FCM later.
 */
function getConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!getApps().length) {
    try {
      app = initializeApp(getConfig());
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[firebase] initializeApp failed:", e);
      }
      return null;
    }
  } else {
    app = getApps()[0]!;
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!auth) auth = getAuth(a);
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!db) db = getFirestore(a);
  return db;
}

/** Firestore security rules require `request.auth.uid` to match the document path. */
export function canUseFirestoreSync(uid: string | null | undefined): boolean {
  if (!isFirebaseConfigured() || !uid) return false;
  const auth = getFirebaseAuth();
  const u = auth?.currentUser;
  return u?.uid === uid;
}
