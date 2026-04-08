"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { setFirebaseProfileSyncUid } from "@/lib/account-profile-storage";
import { hydrateUserDataFromFirestore } from "@/lib/firebase/hydrate-user-data";
import { clearAllSessionsExceptTheme } from "@/lib/clear-session-storage";
import {
  normalizeAccessScope,
  resolveAccessScopeFromRecord,
  type AccessScope,
} from "@/lib/panel-access";

export type AuthStatus = "loading" | "ready";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  accessScope: AccessScope;
  /**
   * False until the first read of `users/{uid}/profile/account` completes.
   * Avoids treating the initial placeholder `"none"` as real before Firestore responds.
   */
  accessScopeReady: boolean;
};

function mapFirebaseUser(u: FirebaseUser): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    accessScope: "none",
    accessScopeReady: false,
  };
}

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseEnvMissingMessage(): string {
  return "Firebase is not configured: set all NEXT_PUBLIC_FIREBASE_* variables (see web/.env.example). On Vercel, add them for Production and redeploy so the live site includes them.";
}

/** When API key exists but initializeApp failed (wrong values) or auth is unavailable. */
function firebaseInitFailedMessage(): string {
  if (!isFirebaseConfigured()) return firebaseEnvMissingMessage();
  return "Firebase could not start: copy every field from Firebase Console → Project settings → Your apps → Web app into Vercel Environment Variables (NEXT_PUBLIC_FIREBASE_*), save, redeploy, then hard-refresh.";
}

function formatFirebaseAuthError(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case "auth/operation-not-allowed":
        return "Email/password sign-in is off in Firebase. Open Firebase Console → Authentication → Sign-in method → enable Email/Password (this is not a database issue).";
      case "auth/email-already-in-use":
        return "This email is already registered. Sign in instead.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Wrong email or password.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again in a few minutes.";
      default:
        return e.message || "Sign-in failed.";
    }
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(null);
      setStatus("ready");
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(mapFirebaseUser(u));
      } else {
        setUser(null);
      }
      setStatus("ready");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setFirebaseProfileSyncUid(user?.uid ?? null);
    if (!user?.uid || !isFirebaseConfigured()) return;
    void hydrateUserDataFromFirestore(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    if (!isFirebaseConfigured()) {
      setUser((prev) =>
        prev ? { ...prev, accessScope: "none", accessScopeReady: true } : prev
      );
      return;
    }
    let cancelled = false;
    void (async () => {
      const authClient = getFirebaseAuth();
      const cu = authClient?.currentUser;
      if (cu?.uid === user.uid) {
        try {
          const token = await cu.getIdToken();
          const res = await fetch("/api/user/access-scope", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = (await res.json()) as { accessScope?: unknown };
            const scope = normalizeAccessScope(json.accessScope);
            if (!cancelled) {
              setUser((prev) =>
                prev ? { ...prev, accessScope: scope, accessScopeReady: true } : prev
              );
            }
            return;
          }
        } catch {
          /* fall back to client Firestore */
        }
      }

      const db = getFirebaseDb();
      if (!db) {
        if (!cancelled) {
          setUser((prev) =>
            prev ? { ...prev, accessScope: "none", accessScopeReady: true } : prev
          );
        }
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid, "profile", "account"));
        if (cancelled) return;
        const scope = resolveAccessScopeFromRecord(
          snap.data() as Record<string, unknown> | undefined
        );
        setUser((prev) =>
          prev ? { ...prev, accessScope: scope, accessScopeReady: true } : prev
        );
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          const detail =
            e instanceof FirebaseError
              ? `${e.code} — ${e.message}`
              : e instanceof Error
                ? e.message
                : String(e);
          console.warn(
            "[auth] Could not read users/<uid>/profile/account (accessScope stays none).",
            detail,
            "If you see firestore/permission-denied, deploy web/firestore.rules or check Firebase project ID matches NEXT_PUBLIC_FIREBASE_PROJECT_ID."
          );
        }
        if (!cancelled) {
          setUser((prev) =>
            prev ? { ...prev, accessScope: "none", accessScopeReady: true } : prev
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(firebaseInitFailedMessage());
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw new Error(formatFirebaseAuthError(e));
    }
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(firebaseInitFailedMessage());
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw new Error(formatFirebaseAuthError(e));
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  }, []);

  const logoutAllDevices = useCallback(async () => {
    clearAllSessionsExceptTheme();
    setUser(null);
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    void phone;
    if (!isFirebaseConfigured()) {
      throw new Error(firebaseEnvMissingMessage());
    }
    throw new Error(
      "SMS verification is not available right now. Please try again later."
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      signInEmail,
      signUpEmail,
      signOut,
      logoutAllDevices,
      requestOtp,
    }),
    [user, status, signInEmail, signUpEmail, signOut, logoutAllDevices, requestOtp]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
