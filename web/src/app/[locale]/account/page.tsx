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
  Sparkles,
  Crown,
  Wallet,
  ClipboardList,
  CircleUser,
  Settings,
  CreditCard,
  Store,
} from "lucide-react";
import { AccountNavTiles } from "@/components/account-nav-tiles";
import { ProfileAvatarPreview } from "@/components/profile-avatar-preview";
import { CategoryAwarePrice } from "@/components/category-aware-price";
import { AccountLegalInformation } from "@/components/account-legal-information";
import { readProfile, type StoredProfile } from "@/lib/account-profile-storage";
import { getWallet, walletUserId } from "@/lib/wallet-storage";
import {
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

  const [profile, setProfile] = useState<StoredProfile>(() => readProfile());
  const [walletPaise, setWalletPaise] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const sync = () => setProfile(readProfile());
    sync();
    window.addEventListener("lc-profile", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lc-profile", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

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

  const displayName = useMemo(() => {
    const saved = profile.displayName?.trim();
    if (saved) return saved;
    if (!user) return "";
    if (user.displayName) return user.displayName;
    const e = user.email;
    if (e) return e.split("@")[0] ?? "Member";
    return "Member";
  }, [profile.displayName, user]);

  const isPremium = useMemo(() => {
    if (!user?.uid) return false;
    let h = 0;
    for (let i = 0; i < user.uid.length; i++) h += user.uid.charCodeAt(i);
    return h % 4 === 0;
  }, [user]);

  const showManageStore = useMemo(() => {
    if (!user?.accessScopeReady) return false;
    const p = permissionsForScope(user.accessScope ?? "none");
    return Object.values(p).some(Boolean);
  }, [user]);

  const accountNavItems = useMemo(() => {
    const rows = [
      { href: "/account/orders", label: t("navOrders"), icon: ClipboardList },
      { href: "/account/personal", label: t("personalInfo"), icon: CircleUser },
      { href: "/account/settings", label: t("navSettings"), icon: Settings },
      { href: "/account/wishlist", label: t("navWishlist"), icon: Heart },
      { href: "/account/payments", label: t("navPayments"), icon: CreditCard },
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
    <div className="account-prose-tight space-y-8 sm:space-y-10">
      <header
        className={`${appCard} flex flex-col gap-6 rounded-[22px] p-4 sm:p-6 md:flex-row md:items-center md:justify-between`}
      >
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 rounded-full bg-gradient-to-br from-white/45 via-amber-100/25 to-[#3b82f6]/45 p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="rounded-full bg-[#0c1019] p-[2px]">
              <ProfileAvatarPreview
                imageSrc={profile.photoDataUrl}
                initials={displayName.slice(0, 2)}
                nameLabel={displayName}
                sizeClassName="h-[76px] w-[76px]"
                className="[&_button]:ring-2 [&_button]:ring-white/25 [&_button]:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e8edf5] sm:text-2xl">
              {displayName}
            </h1>
            {user?.email ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isPremium ? (
                <span className="relative inline-flex overflow-hidden rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-700 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_2px_12px_rgba(245,158,11,0.45)] ring-1 ring-amber-300/50">
                  <span
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                    aria-hidden
                  >
                    <span className="absolute -left-1/4 top-0 h-full w-[55%] min-w-[4rem] bg-gradient-to-r from-transparent via-white/45 to-transparent animate-account-premium-shimmer" />
                  </span>
                  <span className="relative flex items-center gap-1">
                    <Crown className="h-3 w-3" strokeWidth={2} />
                    {t("memberPremium")}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-300">
                  <Sparkles className="h-3 w-3" />
                  {t("memberRegular")}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="account-nav-heading">
        <h2 id="account-nav-heading" className={sectionLabel}>
          {t("accountNavHeading")}
        </h2>
        <AccountNavTiles items={accountNavItems} className="mt-3" />
      </section>

      <div
        className={`${appCard} flex flex-col gap-4 rounded-[18px] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("storeBalance")}
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-[#e8edf5]">
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
        <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <div className={`${appCard} rounded-[18px] p-4`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <ShoppingBag className="h-4 w-4 text-[#0066ff]" />
              <p className="text-xs font-semibold">{t("statOrders")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-[#e8edf5]">
              {orderCount}
            </p>
          </div>
          <div className={`${appCard} rounded-[18px] p-4`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold">{t("statTotalSpent")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-[#e8edf5]">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className={`${appCard} rounded-[18px] p-4`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Heart className="h-4 w-4 text-rose-500" />
              <p className="text-xs font-semibold">{t("statSavedItems")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-[#e8edf5]">
              {wishIds.length}
            </p>
          </div>
          <div className={`${appCard} rounded-[18px] p-4`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <ShoppingBag className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-semibold">{t("statCart")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-[#e8edf5]">
              {cartCount}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-[#e8edf5]">
          {t("recentTitle")}
        </h2>
        {recentProducts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t("recentDesc")}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentProducts.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/product/${p.id}`}
                  className={`${appCard} ${pressable} flex min-w-0 justify-between gap-2 rounded-xl px-3 py-3 text-sm text-slate-700 transition hover:border-[#0066ff]/35 dark:text-slate-200 sm:px-4`}
                >
                  <span className="min-w-0 line-clamp-2 font-medium sm:line-clamp-1">
                    {p.title}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    <CategoryAwarePrice product={p} variant="inline" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AccountLegalInformation />
    </div>
  );
}
