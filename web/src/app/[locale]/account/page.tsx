"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useRecent } from "@/context/recent-context";
import { getProductById } from "@/lib/storefront-catalog";
import { getUserPaymentHistory } from "@/lib/user-payment-history";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  IndianRupee,
  Heart,
  Sparkles,
  Crown,
  Wallet,
} from "lucide-react";
import { ProfileAvatarPreview } from "@/components/profile-avatar-preview";
import { CategoryAwarePrice } from "@/components/category-aware-price";
import { AccountLegalInformation } from "@/components/account-legal-information";
import { readProfile, type StoredProfile } from "@/lib/account-profile-storage";
import { getWallet, walletUserId } from "@/lib/wallet-storage";

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
      <header className="glass flex flex-col gap-6 rounded-3xl border border-slate-200/80 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <ProfileAvatarPreview
            imageSrc={profile.photoDataUrl}
            initials={displayName.slice(0, 2)}
            nameLabel={displayName}
          />
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              {displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isPremium ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                  <Crown className="h-3 w-3" />
                  {t("memberPremium")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  <Sparkles className="h-3 w-3" />
                  {t("memberRegular")}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="glass flex flex-col gap-4 rounded-2xl border border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("storeBalance")}
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              ₹{(walletPaise / 100).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <Link
          href="/account/payments#wallet-add-money"
          className="inline-flex items-center justify-center rounded-xl bg-[#2874f0] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1a65d8]"
        >
          {t("walletAddMoneyTitle")}
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {t("quickStats")}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ShoppingBag className="h-4 w-4 text-[#0066ff]" />
              <p className="text-xs font-semibold">{t("statOrders")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {orderCount}
            </p>
          </div>
          <div className="glass rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold">{t("statTotalSpent")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="glass rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Heart className="h-4 w-4 text-rose-500" />
              <p className="text-xs font-semibold">{t("statSavedItems")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {wishIds.length}
            </p>
          </div>
          <div className="glass rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ShoppingBag className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-semibold">{t("statCart")}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {cartCount}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900">{t("recentTitle")}</h2>
        {recentProducts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t("recentDesc")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentProducts.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/product/${p.id}`}
                  className="glass flex min-w-0 justify-between gap-2 rounded-xl border border-slate-200/60 px-3 py-3 text-sm text-slate-700 transition hover:border-[#0066ff]/30 hover:bg-white sm:px-4"
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
