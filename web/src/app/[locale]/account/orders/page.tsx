"use client";

import { useEffect, useMemo, useState } from "react";
import { AccountOrderCard } from "@/components/account-order-card";
import {
  orderFromFirestoreRecord,
  type AccountOrder,
} from "@/lib/account-order-view";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import {
  getFirebaseDb,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import { subscribeUserOrdersFromFirestore } from "@/lib/user-order-firestore";
export default function AccountOrdersPage() {
  const t = useTranslations("orders");
  const { user } = useAuth();
  /** null = Firestore not used (guest / not configured); array = subscribed list (may be empty). */
  const [remote, setRemote] = useState<AccountOrder[] | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    if (!isFirebaseConfigured() || !user?.uid) {
      setRemote(null);
      setHydrated(true);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setRemote(null);
      setHydrated(true);
      return;
    }
    const unsub = subscribeUserOrdersFromFirestore(
      db,
      user.uid,
      (rows) => {
        setRemote(rows.map(orderFromFirestoreRecord));
        setHydrated(true);
      },
      () => {
        setRemote([]);
        setHydrated(true);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  const orders = useMemo(
    () => (remote !== null ? remote : []),
    [remote]
  );

  const showSignInHint = remote === null && !user;
  const showFirebaseHint = remote === null && Boolean(user) && !isFirebaseConfigured();
  const showLiveNote = remote !== null;

  if (!hydrated) {
    return (
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-sm text-slate-500">{t("loadingOrders")}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
        {t("title")}
      </h1>
      {showSignInHint ? (
        <p className="mt-1 text-sm text-slate-500">{t("signInForOrders")}</p>
      ) : null}
      {showFirebaseHint ? (
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          {t("ordersNeedFirebase")}
        </p>
      ) : null}
      {showLiveNote ? (
        <p className="mt-1 text-sm text-slate-500">{t("liveOrdersNote")}</p>
      ) : null}

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t("emptyOrders")}</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {orders.map((o) => (
            <li key={o.id}>
              <AccountOrderCard
                order={o}
                preferFirestoreTracking={remote !== null}
                firebaseUid={user?.uid ?? null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
