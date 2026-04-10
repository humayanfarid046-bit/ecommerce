"use client";

import { Link } from "@/i18n/navigation";
import {
  X,
  Home,
  Gift,
  Package,
  Heart,
  User,
  Wallet,
  ShoppingBag,
  MapPin,
  CreditCard,
  Shield,
  MessageCircle,
  LogOut,
  Sparkles,
  Crown,
  ChevronRight,
  Phone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { useWishlist } from "@/context/wishlist-context";
import { getWallet, walletUserId } from "@/lib/wallet-storage";
import { getUserPaymentHistory } from "@/lib/user-payment-history";
import { readProfile } from "@/lib/account-profile-storage";
import { loadGamification } from "@/lib/gamification-storage";
import { ProfileAvatarPreview } from "@/components/profile-avatar-preview";
import { DrawerCategoryAccordion } from "@/components/drawer-category-accordion";
import { DrawerOutfitChips } from "@/components/drawer-outfit-chips";
import { logWhatsAppClick } from "@/lib/support-review-storage";
import {
  fetchStorefrontContact,
  whatsappHref,
} from "@/lib/storefront-contact-client";
import { useMobileDrawer } from "@/context/mobile-drawer-context";

function Divider() {
  return (
    <div
      className="my-3 border-t border-slate-200/90 dark:border-slate-700/90"
      role="separator"
    />
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

type RowProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  onNavigate?: () => void;
  hint?: string;
};

function DrawerRow({ href, icon, label, onNavigate, hint }: RowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 text-left transition hover:border-slate-200 hover:bg-white dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </Link>
  );
}

export function MobileNavDrawer() {
  const { drawerOpen, closeDrawer, drawerMode } = useMobileDrawer();
  const isCategoryOnly = drawerMode === "categories";
  const { user, status: authStatus, signOut } = useAuth();
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const { ids: wishIds } = useWishlist();
  const [waHref, setWaHref] = useState("https://wa.me/");
  const [walletPaise, setWalletPaise] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [profileTick, setProfileTick] = useState(0);
  const [gamifyTick, setGamifyTick] = useState(0);
  const [logoutAsk, setLogoutAsk] = useState(false);

  const wUid = walletUserId(user);
  void profileTick;
  const profile = readProfile();

  useEffect(() => {
    const sync = () => {
      setWalletPaise(getWallet(wUid).balancePaise);
    };
    sync();
    window.addEventListener("lc-wallet", sync);
    return () => window.removeEventListener("lc-wallet", sync);
  }, [wUid]);

  useEffect(() => {
    function syncOrders() {
      if (!user?.uid) {
        setOrderCount(0);
        return;
      }
      const pay = getUserPaymentHistory().filter((p) => p.status === "success");
      setOrderCount(pay.length);
    }
    syncOrders();
    window.addEventListener("lc-user-payment-history", syncOrders);
    return () =>
      window.removeEventListener("lc-user-payment-history", syncOrders);
  }, [user?.uid]);

  useEffect(() => {
    const fn = () => setProfileTick((x) => x + 1);
    window.addEventListener("lc-profile", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("lc-profile", fn);
      window.removeEventListener("storage", fn);
  };
  }, []);

  useEffect(() => {
    const fn = () => setGamifyTick((x) => x + 1);
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const c = await fetchStorefrontContact();
      if (cancelled) return;
      setWaHref(
        whatsappHref(c, "Hi — I need help with my order.")
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) setLogoutAsk(false);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen) setGamifyTick((x) => x + 1);
  }, [drawerOpen]);

  const displayName = useMemo(() => {
    const saved = profile.displayName?.trim();
    if (saved) return saved;
    if (!user) return "";
    if (user.displayName) return user.displayName;
    const e = user.email;
    if (e) return e.split("@")[0] ?? "";
    return "";
  }, [profile.displayName, user]);

  const isPremium = useMemo(() => {
    if (!user?.uid) return false;
    let h = 0;
    for (let i = 0; i < user.uid.length; i++) h += user.uid.charCodeAt(i);
    return h % 4 === 0;
  }, [user]);

  const points = useMemo(() => {
    void gamifyTick;
    return loadGamification().points;
  }, [gamifyTick]);

  const close = () => closeDrawer();

  const signedIn = authStatus === "ready" && Boolean(user);

  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity md:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-[70] flex h-[100dvh] max-h-[100dvh] w-[min(100vw-2rem,340px)] flex-col bg-slate-100 shadow-xl transition-transform duration-300 ease-out dark:bg-slate-950 md:hidden",
          drawerOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-[#2874f0] px-3 py-3 text-white dark:border-slate-700">
          <p className="text-sm font-bold">
            {isCategoryOnly ? t("drawerGroupCategories") : t("drawerMenuTitle")}
          </p>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/15"
            aria-label={t("closeMenu")}
            onClick={close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 pt-3 pb-[max(2.25rem,env(safe-area-inset-bottom,0px)+1.25rem)] [scrollbar-gutter:stable]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {isCategoryOnly ? (
              <div className="space-y-3">
                <p className="text-xs leading-snug text-slate-600 dark:text-slate-400">
                  {t("drawerCategoriesHint")}
                </p>
                <DrawerCategoryAccordion onPick={close} />
                <DrawerOutfitChips onPick={close} />
              </div>
            ) : (
              <>
            <GroupLabel>{t("drawerGroupProfile")}</GroupLabel>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              {signedIn ? (
                <>
                  <div className="flex gap-3">
                    <ProfileAvatarPreview
                      imageSrc={profile.photoDataUrl}
                      initials={(displayName || user!.email || "U").slice(0, 2)}
                      nameLabel={displayName || user!.email || ""}
                      sizeClassName="h-14 w-14"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("drawerSignedInAs")}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                        {displayName || user!.email}
                      </p>
                      {user!.email ? (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user!.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        <Crown className="h-3 w-3" />
                        {t("drawerBadgePremium")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Sparkles className="h-3 w-3" />
                        {t("drawerBadgeRegular")}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/account/payments#wallet-add-money"
                    onClick={close}
                    className="mt-3 flex items-center justify-between rounded-xl bg-[#2874f0]/10 px-3 py-2.5 text-left dark:bg-[#2874f0]/20"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Wallet className="h-4 w-4 text-[#2874f0]" />
                      {t("drawerWalletBalance")}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      ₹{(walletPaise / 100).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </Link>
                  <p className="mt-1 text-right">
                    <Link
                      href="/account/payments#wallet-add-money"
                      onClick={close}
                      className="text-xs font-bold text-[#2874f0] hover:underline"
                    >
                      {t("drawerAddMoney")}
                    </Link>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-center dark:border-slate-700 dark:bg-slate-800/80">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("drawerStatOrders")}
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {orderCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-center dark:border-slate-700 dark:bg-slate-800/80">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("drawerStatWishlist")}
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {wishIds.length}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("drawerGuestProfileHint")}
                  </p>
                  <Link
                    href="/login"
                    onClick={close}
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#2874f0] px-4 py-2.5 text-sm font-bold text-white"
                  >
                    {t("login")}
                  </Link>
                </div>
              )}
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupShop")}</GroupLabel>
            <div className="space-y-1">
              <DrawerRow
                href="/"
                onNavigate={close}
                icon={<Home className="h-4 w-4" />}
                label={t("drawerHomeShop")}
              />
              <DrawerRow
                href="/rewards"
                onNavigate={close}
                icon={<Gift className="h-4 w-4" />}
                label={t("drawerRewardsSpin")}
                hint={t("drawerPointsShort", { n: points })}
              />
              <DrawerRow
                href="/account/orders"
                onNavigate={close}
                icon={<Package className="h-4 w-4" />}
                label={t("drawerMyOrders")}
              />
              <DrawerRow
                href="/account/wishlist"
                onNavigate={close}
                icon={<Heart className="h-4 w-4" />}
                label={t("drawerMyWishlist")}
              />
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupAccount")}</GroupLabel>
            <div className="space-y-1">
              <DrawerRow
                href="/account/settings#settings-profile"
                onNavigate={close}
                icon={<User className="h-4 w-4" />}
                label={t("drawerProfileSettings")}
              />
              <DrawerRow
                href="/account/settings#settings-addresses"
                onNavigate={close}
                icon={<MapPin className="h-4 w-4" />}
                label={t("drawerSavedAddresses")}
              />
              <DrawerRow
                href="/account/payments"
                onNavigate={close}
                icon={<CreditCard className="h-4 w-4" />}
                label={t("drawerPaymentsRefunds")}
              />
              <DrawerRow
                href="/account/settings#settings-security"
                onNavigate={close}
                icon={<Shield className="h-4 w-4" />}
                label={t("drawerSecurity")}
              />
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupSupport")}</GroupLabel>
            <div className="space-y-1">
              <DrawerRow
                href="/help#contact"
                onNavigate={close}
                icon={<Phone className="h-4 w-4" />}
                label={t("drawerContactUs")}
                hint={t("drawerContactUsHint")}
              />
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-slate-200 hover:bg-white dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
                onClick={() => {
                  try {
                    logWhatsAppClick(
                      typeof window !== "undefined"
                        ? window.location.pathname
                        : ""
                    );
                  } catch {
                    /* ignore */
                  }
                  close();
                }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {t("drawerWhatsApp")}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupApp")}</GroupLabel>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t("languageLabel")}
                </span>
                <LanguageSwitcher />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t("themeToggle")}
                </span>
                <ThemeToggle />
              </div>
              {signedIn ? (
                <button
                  type="button"
                  onClick={() => setLogoutAsk(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  {t("drawerLogout")}
                </button>
              ) : null}
            </div>

            <Link
              href="/account"
              onClick={close}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-200/80 py-2.5 text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("drawerMyAccountFull")}
            </Link>

            <div className="mt-6 border-t border-slate-200/90 pt-4 dark:border-slate-700/90">
              <nav
                className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-center text-[11px] font-medium text-slate-600 dark:text-slate-400"
                aria-label={t("drawerMenuFooterAria")}
              >
                <Link href="/about" onClick={close} className="hover:text-[#2874f0]">
                  {t("drawerAboutUs")}
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  |
                </span>
                <Link
                  href="/help#contact"
                  onClick={close}
                  className="hover:text-[#2874f0]"
                >
                  {t("drawerContactUs")}
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  |
                </span>
                <Link href="/privacy" onClick={close} className="hover:text-[#2874f0]">
                  {tf("footerPrivacy")}
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  |
                </span>
                <Link href="/terms" onClick={close} className="hover:text-[#2874f0]">
                  {tf("footerTerms")}
                </Link>
              </nav>
              <p className="mt-3 text-center text-[10px] leading-snug text-slate-500 dark:text-slate-500">
                {tf("footerCopyright", {
                  year: new Date().getFullYear(),
                })}
              </p>
            </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {logoutAsk ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          onClick={() => setLogoutAsk(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-confirm-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-50"
            >
              {t("drawerLogoutConfirmTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("drawerLogoutConfirmBody")}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                onClick={() => setLogoutAsk(false)}
              >
                {t("drawerLogoutCancel")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
                onClick={() => {
                  setLogoutAsk(false);
                  close();
                  void signOut();
                }}
              >
                {t("drawerLogoutConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
