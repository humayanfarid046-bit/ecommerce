"use client";

import { useEffect, useMemo, useState } from "react";
import { AccountOrderCard } from "@/components/account-order-card";
import {
  DEMO_ORDERS,
  demoOrderFromFirestoreRecord,
  type DemoOrder,
} from "@/lib/demo-orders";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/auth-context";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeUserOrdersFromFirestore } from "@/lib/user-order-firestore";
export default function AccountOrdersPage() {
  const t = useTranslations("orders");
  const { user } = useAuth();
  /** null = show demo sample; array = Firestore-backed list (may be empty). */
  const [remote, setRemote] = useState<DemoOrder[] | null>(null);
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
        setRemote(rows.map(demoOrderFromFirestoreRecord));
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
    () => (remote !== null ? remote : DEMO_ORDERS),
    [remote]
  );

  const showDemoNote = remote === null;
  const showLiveNote = remote !== null;

  if (!hydrated) {
    return (
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-sm text-slate-500">{t("loadingOrders")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
        {t("title")}
      </h1>
      {showDemoNote ? (
        <p className="mt-1 text-sm text-slate-500">{t("demoNote")}</p>
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
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
