"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useRecent } from "@/context/recent-context";
import { getProductById } from "@/lib/storefront-catalog";
import { getUserPaymentHistory } from "@/lib/user-payment-history";
import { permissionsForScope } from "@/lib/panel-access";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  IndianRupee,
  Heart,
  Wallet,
  ClipboardList,
  MapPin,
  Settings,
  CreditCard,
  Store,
} from "lucide-react";
import { AccountNavTiles } from "@/components/account-nav-tiles";
import { CategoryAwarePrice } from "@/components/category-aware-price";
import { getWallet, walletUserId } from "@/lib/wallet-storage";
import {
  accountInfoCard,
  appCard,
  gradientCtaPremium,
  pressable,
  sectionLabel,
} from "@/lib/app-inner-ui";

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const wUid = walletUserId(user);
  const { items } = useCart();
  const { ids: wishIds } = useWishlist();
  const { productIds: recentIds } = useRecent();
  const t = useTranslations("account");

  const [walletPaise, setWalletPaise] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    function sync() {
      setWalletPaise(getWallet(wUid).balancePaise);
    }
    sync();
    window.addEventListener("lc-wallet", sync);
    return () => window.removeEventListener("lc-wallet", sync);
  }, [wUid]);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const recentProducts = useMemo(() => {
    return recentIds
      .map((id) => getProductById(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof getProductById>>[];
  }, [recentIds]);

  const showManageStore = useMemo(() => {
    if (!user?.accessScopeReady) return false;
    const p = permissionsForScope(user.accessScope ?? "none");
    return Object.values(p).some(Boolean);
  }, [user]);

  const accountNavItems = useMemo(() => {
    const rows = [
      { href: "/account/orders", label: t("navOrders"), icon: ClipboardList },
      { href: "/account/settings/addresses", label: t("addressBook"), icon: MapPin },
      { href: "/account/payments", label: t("navPayments"), icon: CreditCard },
      { href: "/account/settings", label: t("navSettings"), icon: Settings },
    ];
    if (showManageStore) {
      rows.push({
        href: "/admin",
        label: t("navManageStore"),
        icon: Store,
      });
    }
    return rows;
  }, [t, showManageStore]);

  useEffect(() => {
    function syncOrderStats() {
      if (!user?.uid) {
        setOrderCount(0);
        setTotalSpent(0);
        return;
      }
      const pay = getUserPaymentHistory().filter((p) => p.status === "success");
      setOrderCount(pay.length);
      setTotalSpent(pay.reduce((s, p) => s + p.amountRupees, 0));
    }
    syncOrderStats();
    window.addEventListener("lc-user-payment-history", syncOrderStats);
    return () =>
      window.removeEventListener("lc-user-payment-history", syncOrderStats);
  }, [user?.uid]);

  return (
    <div className="account-prose-tight space-y-4 sm:space-y-6">
      <section aria-labelledby="account-nav-heading">
        <h2 id="account-nav-heading" className={sectionLabel}>
          {t("accountNavHeading")}
        </h2>
        <AccountNavTiles items={accountNavItems} className="mt-4" />
      </section>

      <div
        className={`${accountInfoCard} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {t("storeBalance")}
            </p>
            <p className="text-2xl font-extrabold text-text-primary dark:text-[#e8edf5]">
              ₹{(walletPaise / 100).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <Link
          href="/account/payments#wallet-add-money"
          className={`${gradientCtaPremium} inline-flex items-center justify-center px-5 py-3 text-sm font-bold`}
        >
          {t("walletAddMoneyTitle")}
        </Link>
      </div>

      <div>
        <h2 className={sectionLabel}>{t("quickStats")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <div className={`${accountInfoCard} p-4`}>
            <div className="flex items-center gap-2 text-text-secondary dark:text-slate-400">
              <ShoppingBag className="h-4 w-4 text-[#0066ff]" />
              <p className="text-xs font-semibold">{t("statOrders")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-text-primary dark:text-[#e8edf5]">
              {orderCount}
            </p>
          </div>
          <div className={`${accountInfoCard} p-4`}>
            <div className="flex items-center gap-2 text-text-secondary dark:text-slate-400">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold">{t("statTotalSpent")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-text-primary dark:text-[#e8edf5]">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className={`${accountInfoCard} p-4`}>
            <div className="flex items-center gap-2 text-text-secondary dark:text-slate-400">
              <Heart className="h-4 w-4 text-rose-500" />
              <p className="text-xs font-semibold">{t("statSavedItems")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-text-primary dark:text-[#e8edf5]">
              {wishIds.length}
            </p>
          </div>
          <div className={`${accountInfoCard} p-4`}>
            <div className="flex items-center gap-2 text-text-secondary dark:text-slate-400">
              <ShoppingBag className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-semibold">{t("statCart")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-text-primary dark:text-[#e8edf5]">
              {cartCount}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-text-primary dark:text-[#e8edf5]">
          {t("recentTitle")}
        </h2>
        {recentProducts.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary dark:text-slate-400">
            {t("recentDesc")}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentProducts.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/product/${p.id}`}
                  className={`${appCard} ${pressable} flex min-w-0 justify-between gap-2 rounded-xl px-3 py-3 text-sm text-text-primary transition hover:border-[#0066ff]/35 dark:text-slate-200 sm:px-4`}
                >
                  <span className="min-w-0 line-clamp-2 font-medium sm:line-clamp-1">
                    {p.title}
                  </span>
                  <span className="shrink-0 text-text-secondary">
                    <CategoryAwarePrice product={p} variant="inline" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
