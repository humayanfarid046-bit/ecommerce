"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  User,
  Menu,
  Heart,
  X,
  CircleHelp,
  Gift,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { SearchBar } from "@/components/search-bar";
import { CategoryNav } from "@/components/category-nav";
import { NotificationInbox } from "@/components/notification-inbox";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORE_SHELL } from "@/lib/store-layout";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/context/wishlist-context";
import { useCartFlight } from "@/context/cart-flight-context";
import { useAuth } from "@/context/auth-context";
import { categories } from "@/lib/storefront-catalog";
import { useMobileDrawer } from "@/context/mobile-drawer-context";
import { getSupportState, logWhatsAppClick } from "@/lib/support-review-storage";

function CategoryDrawerAccordion({
  onPick,
}: {
  onPick: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const tc = useTranslations("categories");
  const ts = useTranslations("categorySub");

  return (
    <div className="space-y-0.5">
      {categories.map((c) => {
        const hasChildren = Boolean(c.children?.length);
        const expanded = openId === c.id;
        const title = tc(c.slug);
        if (!hasChildren) {
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              onClick={onPick}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
            >
              <span className="text-lg" aria-hidden>
                {c.icon}
              </span>
              <span className="min-w-0 truncate">{title}</span>
            </Link>
          );
        }
        return (
          <div
            key={c.id}
            className="rounded-lg border border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : c.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              <span className="text-lg" aria-hidden>
                {c.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{title}</span>
              <span className="shrink-0 text-[10px] font-bold text-slate-400">
                {expanded ? "−" : "+"}
              </span>
            </button>
            {expanded ? (
              <div className="border-t border-slate-100 px-2 py-2 dark:border-slate-600">
                <Link
                  href={`/category/${c.slug}`}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-[#2874f0]"
                  onClick={onPick}
                >
                  {tc("viewAllInCategory", { name: title })}
                </Link>
                {c.children!.map((ch) => (
                  <Link
                    key={ch.slug}
                    href={`/category/${c.slug}?sub=${ch.slug}`}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700/80"
                    onClick={onPick}
                  >
                    {ts(ch.slug)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function SiteHeader() {
  const { user, status: authStatus } = useAuth();
  const { cartIconRef } = useCartFlight();
  const { items } = useCart();
  const { ids: wishIds } = useWishlist();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const { drawerOpen, openDrawer, closeDrawer } = useMobileDrawer();
  const t = useTranslations("nav");
  const tb = useTranslations("brand");

  const displayName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "";

  const [waHref, setWaHref] = useState(
    "https://wa.me/919876543210?text=Hi%20%E2%80%94%20I%20need%20help%20with%20my%20order."
  );
  useEffect(() => {
    const sync = () => {
      const num = getSupportState().chatConfig.whatsappE164.replace(/\D/g, "");
      setWaHref(
        `https://wa.me/${num}?text=${encodeURIComponent("Hi — I need help with my order.")}`
      );
    };
    sync();
    window.addEventListener("lc-support", sync);
    return () => window.removeEventListener("lc-support", sync);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <header className="sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
      <div className="bg-[#2874f0] text-white">
        <div
          className={`${STORE_SHELL} flex flex-col gap-2.5 py-2 md:flex-row md:flex-wrap md:items-center md:gap-4 md:py-2.5`}
        >
          {/* Mobile: row1 logo + menu + wishlist + cart; row2 full-width search; desktop: logo | search | nav */}
          <div className="flex w-full min-w-0 items-center justify-between gap-2 md:contents">
            <div className="flex min-h-[44px] min-w-0 shrink-0 items-center gap-2 md:order-1">
              <Link
                href="/"
                className="flex min-h-[44px] shrink-0 items-center text-base font-extrabold tracking-tight text-white min-[400px]:text-lg md:text-xl"
              >
                <span className="italic">{tb("name")}</span>
              </Link>

              <button
                type="button"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
                aria-label={t("menu")}
                onClick={() => openDrawer()}
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            <nav className="ml-auto flex min-h-[44px] shrink-0 items-center gap-2.5 sm:gap-3 md:order-3 md:ml-auto md:gap-4 lg:gap-6">
              <div className="hidden items-center gap-2 md:flex">
                <ThemeToggle variant="onPrimary" />
                <LanguageSwitcher variant="onPrimary" />
              </div>
              <div className="hidden md:block">
                <NotificationInbox variant="onPrimary" />
              </div>
              <Link
                href="/help"
                className="hidden flex-col items-center gap-0.5 px-1 text-[11px] font-medium leading-tight text-white hover:underline md:flex"
                title={t("helpSupport")}
              >
                <CircleHelp className="h-5 w-5" strokeWidth={2} />
                {t("helpShort")}
              </Link>
              {authStatus === "ready" && user ? (
                <Link
                  href="/account"
                  className="hidden max-w-[5.5rem] flex-col items-center gap-0.5 px-1 text-[11px] font-medium leading-tight text-white hover:underline md:flex"
                >
                  <User className="h-5 w-5" strokeWidth={2} />
                  <span className="line-clamp-2 text-center leading-tight">
                    {t("account")}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden flex-col items-center gap-0.5 px-1 text-[11px] font-medium leading-tight text-white hover:underline md:flex"
                >
                  <User className="h-5 w-5" strokeWidth={2} />
                  {t("login")}
                </Link>
              )}
              <Link
                href="/wishlist"
                className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 md:size-auto md:min-h-0 md:min-w-0 md:p-2.5"
                aria-label={t("wishlist")}
              >
                <span className="relative inline-flex items-center justify-center">
                  <Heart className="h-5 w-5" strokeWidth={2} />
                  {wishIds.length > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6161] px-0.5 text-[10px] font-bold text-white ring-2 ring-[#2874f0]">
                      {wishIds.length > 9 ? "9+" : wishIds.length}
                    </span>
                  )}
                </span>
              </Link>
              <motion.div whileTap={{ scale: 0.96 }} className="shrink-0">
                <Link
                  ref={cartIconRef}
                  href="/cart"
                  className="relative inline-flex size-11 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-white md:size-auto md:min-h-0 md:min-w-0 md:px-1"
                  aria-label={t("cart")}
                >
                  <span className="relative inline-flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 md:h-5 md:w-5" strokeWidth={2} />
                    {count > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff9f00] px-1 text-[11px] font-extrabold text-white ring-2 ring-[#2874f0]">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </span>
                  <span className="hidden md:inline">{t("cart")}</span>
                </Link>
              </motion.div>
            </nav>
          </div>

          <div className="w-full min-w-0 md:order-2 md:mx-2 md:max-w-2xl md:flex-1 lg:max-w-3xl">
            <SearchBar variant="flipkart" />
          </div>
        </div>
      </div>

      {/* Mobile: horizontal category icons */}
      <div className="border-b border-slate-200 bg-white md:hidden">
        <CategoryNav variant="mobileScroll" />
      </div>

      {/* Desktop category strip */}
      <div className="hidden border-b border-slate-200 bg-white shadow-sm md:block">
        <CategoryNav flipkartStyle />
      </div>

      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity md:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => closeDrawer()}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(100vw-2.5rem,320px)] flex-col bg-white shadow-xl transition-transform duration-300 ease-out md:hidden",
          drawerOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#2874f0] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/90">
              {t("drawerWelcome")}
            </p>
            <p className="truncate text-sm font-bold">
              {authStatus === "ready" && user
                ? displayName || user.email || t("user")
                : t("drawerGuest")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-white/15"
            aria-label={t("closeMenu")}
            onClick={() => closeDrawer()}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex flex-1 flex-col overflow-hidden px-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {t("drawerShopBy")}
          </p>
          <div className="mt-2 flex-1 overflow-y-auto overscroll-contain pb-4">
            <CategoryDrawerAccordion onPick={() => closeDrawer()} />
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/90">
          {authStatus === "ready" && user ? (
            <Link
              href="/account"
              className="mb-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
              onClick={() => closeDrawer()}
            >
              <User className="h-4 w-4 text-[#2874f0]" />
              {t("drawerMyAccount")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="mb-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
              onClick={() => closeDrawer()}
            >
              <User className="h-4 w-4 text-[#2874f0]" />
              {t("login")}
            </Link>
          )}
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("languageLabel")}
            </span>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("themeToggle")}
            </span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              closeDrawer();
              window.dispatchEvent(new CustomEvent("lc-open-support-chat"));
            }}
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-[#2874f0]" />
            {t("drawerSupportChat")}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
            onClick={() => {
              try {
                logWhatsAppClick(
                  typeof window !== "undefined" ? window.location.pathname : ""
                );
              } catch {
                /* ignore */
              }
              closeDrawer();
            }}
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-[#25D366]" />
            {t("drawerWhatsApp")}
          </a>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              closeDrawer();
              window.dispatchEvent(new CustomEvent("lc-open-engagement-hub"));
            }}
          >
            <Gift className="h-4 w-4 shrink-0 text-violet-600" />
            {t("drawerRewards")}
          </button>
          <Link
            href="/help"
            className="mt-0.5 flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => closeDrawer()}
          >
            <CircleHelp className="h-4 w-4 text-[#2874f0]" />
            {t("helpSupport")}
          </Link>
        </div>
      </aside>
    </header>
  );
}
