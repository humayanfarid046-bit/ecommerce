"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { normalizeAccessScope, type AccessScope } from "@/lib/panel-access";

export type AuthStatus = "loading" | "ready";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  accessScope: AccessScope;
};

function mapFirebaseUser(u: FirebaseUser): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    accessScope: "none",
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
    if (!user?.uid || !isFirebaseConfigured()) return;
    const db = getFirebaseDb();
    if (!db) return;
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "profile", "account"));
        if (cancelled) return;
        const scope = normalizeAccessScope(snap.data()?.accessScope);
        setUser((prev) => (prev ? { ...prev, accessScope: scope } : prev));
      } catch {
        if (!cancelled) {
          setUser((prev) => (prev ? { ...prev, accessScope: "none" } : prev));
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
      throw new Error(
        "Sign-in is not available right now. Please try again later."
      );
    }
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        "Registration is not available right now. Please try again later."
      );
    }
    await createUserWithEmailAndPassword(auth, email, password);
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
      throw new Error(
        "SMS sign-in is not available right now. Please try again later."
      );
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
