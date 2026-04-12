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
  ChevronDown,
  Phone,
  FileText,
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
      className="my-3 border-t border-slate-200/80 dark:border-slate-700/90"
      role="separator"
    />
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400">
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

const drawerRowLinkClass =
  "flex items-center gap-3 rounded-xl px-2 py-2.5 text-left text-text-primary transition-colors hover:bg-[#F0F7FF] active:bg-[#F0F7FF] dark:hover:bg-slate-800/80 dark:active:bg-slate-800/80";
const drawerRowIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-[#F8F9FA] text-text-primary dark:border-transparent dark:bg-slate-800 dark:text-slate-200 [&_svg]:stroke-[#212121] dark:[&_svg]:stroke-current";

function DrawerRow({ href, icon, label, onNavigate, hint }: RowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={drawerRowLinkClass}
    >
      <span className={drawerRowIconClass}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text-primary dark:text-slate-50">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] text-text-secondary dark:text-slate-400">
            {hint}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
        aria-hidden
      />
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
  const [logoutAsk, setLogoutAsk] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

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
    if (!drawerOpen) {
      setLogoutAsk(false);
      setLegalOpen(false);
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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
          "fixed left-0 top-0 z-[70] flex h-[100dvh] max-h-[100dvh] w-[min(100vw-2rem,340px)] flex-col bg-[#FFFFFF] shadow-xl transition-transform duration-300 ease-out dark:bg-slate-950 md:hidden",
          drawerOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-[#2563eb] px-3 py-3 text-white dark:border-slate-700">
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
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain bg-[#FFFFFF] px-3 pt-3 pb-[max(2.25rem,env(safe-area-inset-bottom,0px)+1.25rem)] [scrollbar-gutter:stable] dark:bg-slate-950"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {isCategoryOnly ? (
              <div className="space-y-3">
                <p className="text-xs leading-snug text-text-secondary dark:text-slate-400">
                  {t("drawerCategoriesHint")}
                </p>
                <DrawerCategoryAccordion onPick={close} />
                <DrawerOutfitChips onPick={close} />
              </div>
            ) : (
              <>
            <GroupLabel>{t("drawerGroupProfile")}</GroupLabel>
            <div className="rounded-2xl border border-slate-200/90 bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              {signedIn ? (
                <>
                  <div className="flex gap-3">
                    <div className="shrink-0 rounded-full p-[2px] ring-2 ring-[#2563EB] ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-slate-900">
                      <ProfileAvatarPreview
                        imageSrc={profile.photoDataUrl}
                        initials={(displayName || user!.email || "U").slice(0, 2)}
                        nameLabel={displayName || user!.email || ""}
                        sizeClassName="h-14 w-14"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary dark:text-slate-400">
                        {t("drawerSignedInAs")}
                      </p>
                      <p className="truncate text-sm font-bold text-text-primary dark:text-slate-50">
                        {displayName || user!.email}
                      </p>
                      {user!.email ? (
                        <p className="truncate text-xs text-text-secondary dark:text-slate-400">
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
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-bold uppercase text-text-secondary dark:border-transparent dark:bg-slate-800 dark:text-slate-300">
                        <Sparkles className="h-3 w-3" />
                        {t("drawerBadgeRegular")}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/account/payments#wallet-add-money"
                    onClick={close}
                    className="mt-3 flex items-center justify-between rounded-xl border border-[#2874f0]/20 bg-[#F0F7FF] px-3 py-2.5 text-left transition-colors hover:bg-[#E8F2FF] dark:border-transparent dark:bg-[#2874f0]/20 dark:hover:bg-slate-800/90"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-slate-100">
                      <Wallet className="h-4 w-4 text-[#2874f0]" />
                      {t("drawerWalletBalance")}
                    </span>
                    <span className="text-sm font-bold text-text-primary dark:text-white">
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
                    <div className="rounded-xl border border-slate-200/80 bg-[#F8F9FA] px-2 py-2 text-center dark:border-slate-700 dark:bg-slate-800/80">
                      <p className="text-[10px] font-semibold text-text-secondary dark:text-slate-400">
                        {t("drawerStatOrders")}
                      </p>
                      <p className="text-lg font-extrabold text-text-primary dark:text-white">
                        {orderCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-[#F8F9FA] px-2 py-2 text-center dark:border-slate-700 dark:bg-slate-800/80">
                      <p className="text-[10px] font-semibold text-text-secondary dark:text-slate-400">
                        {t("drawerStatWishlist")}
                      </p>
                      <p className="text-lg font-extrabold text-text-primary dark:text-white">
                        {wishIds.length}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-text-secondary dark:text-slate-300">
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
                icon={<Home className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerHomeShop")}
              />
              <DrawerRow
                href="/rewards"
                onNavigate={close}
                icon={<Gift className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerRewardsSpin")}
              />
              <DrawerRow
                href="/account/orders"
                onNavigate={close}
                icon={<Package className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerMyOrders")}
              />
              <DrawerRow
                href="/account/wishlist"
                onNavigate={close}
                icon={<Heart className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerMyWishlist")}
              />
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupAccount")}</GroupLabel>
            <div className="space-y-1">
              <DrawerRow
                href="/account/personal"
                onNavigate={close}
                icon={<User className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerProfileSettings")}
              />
              <DrawerRow
                href="/account/settings/addresses"
                onNavigate={close}
                icon={<MapPin className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerSavedAddresses")}
              />
              <DrawerRow
                href="/account/payments"
                onNavigate={close}
                icon={<CreditCard className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerPaymentsRefunds")}
              />
              <DrawerRow
                href="/account/settings/security"
                onNavigate={close}
                icon={<Shield className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerSecurity")}
              />
            </div>

            <Divider />
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setLegalOpen((o) => !o)}
                className={cn(
                  drawerRowLinkClass,
                  "w-full justify-between font-semibold"
                )}
                aria-expanded={legalOpen}
              >
                <span className={drawerRowIconClass}>
                  <FileText className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 text-left text-sm font-semibold text-text-primary dark:text-slate-50">
                  {t("drawerLegalInformation")}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500",
                    legalOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
              {legalOpen ? (
                <div
                  className="ml-2 space-y-0.5 border-l-2 border-slate-200/80 py-0.5 pl-3 dark:border-slate-600"
                  role="region"
                  aria-label={t("drawerLegalInformation")}
                >
                  <Link
                    href="/privacy"
                    onClick={close}
                    className="flex w-full items-center gap-2 rounded-lg py-2 pl-1 pr-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-[#F0F7FF] dark:text-slate-100 dark:hover:bg-slate-800/80"
                  >
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                    {t("drawerLegalPrivacy")}
                  </Link>
                  <Link
                    href="/terms"
                    onClick={close}
                    className="flex w-full items-center gap-2 rounded-lg py-2 pl-1 pr-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-[#F0F7FF] dark:text-slate-100 dark:hover:bg-slate-800/80"
                  >
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                    {t("drawerLegalTerms")}
                  </Link>
                  <Link
                    href="/shipping"
                    onClick={close}
                    className="flex w-full items-center gap-2 rounded-lg py-2 pl-1 pr-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-[#F0F7FF] dark:text-slate-100 dark:hover:bg-slate-800/80"
                  >
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                    {t("drawerLegalRefund")}
                  </Link>
                  <Link
                    href="/cookies"
                    onClick={close}
                    className="flex w-full items-center gap-2 rounded-lg py-2 pl-1 pr-2 text-left text-sm font-medium text-text-primary transition-colors hover:bg-[#F0F7FF] dark:text-slate-100 dark:hover:bg-slate-800/80"
                  >
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                    {t("drawerLegalCookies")}
                  </Link>
                </div>
              ) : null}
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupSupport")}</GroupLabel>
            <div className="space-y-1">
              <DrawerRow
                href="/help#contact"
                onNavigate={close}
                icon={<Phone className="h-4 w-4" strokeWidth={2} />}
                label={t("drawerContactUs")}
              />
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={drawerRowLinkClass}
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
                <span className={drawerRowIconClass}>
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="flex-1 text-sm font-semibold text-text-primary dark:text-slate-50">
                  {t("drawerWhatsApp")}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
                  aria-hidden
                />
              </a>
            </div>

            <Divider />
            <GroupLabel>{t("drawerGroupApp")}</GroupLabel>
            <div className="rounded-2xl border border-slate-200/90 bg-[#FFFFFF] p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                  {t("languageLabel")}
                </span>
                <LanguageSwitcher />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200/80 pt-2 dark:border-slate-700">
                <span className="text-xs font-semibold text-text-secondary dark:text-slate-300">
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
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-[#F8F9FA] py-2.5 text-sm font-bold text-text-primary transition-colors hover:border-[#2563eb]/35 hover:bg-[#F0F7FF] dark:border-transparent dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2} />
              {t("drawerMyAccountFull")}
            </Link>

            <div className="mt-6 border-t border-slate-200/80 pt-4 dark:border-slate-700/90">
              <nav
                className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-center text-[11px] font-medium text-text-secondary dark:text-slate-400"
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
              <p className="mt-3 text-center text-[10px] leading-snug text-text-secondary dark:text-slate-500">
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
            className="w-full max-w-sm rounded-2xl border border-slate-200/90 bg-[#FFFFFF] p-5 shadow-xl dark:border-transparent dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-confirm-title"
              className="text-lg font-bold text-text-primary dark:text-slate-50"
            >
              {t("drawerLogoutConfirmTitle")}
            </h2>
            <p className="mt-2 text-sm text-text-secondary dark:text-slate-400">
              {t("drawerLogoutConfirmBody")}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200/90 bg-[#F8F9FA] py-2.5 text-sm font-bold text-text-primary dark:border-slate-600 dark:bg-transparent dark:text-slate-200"
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
