"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, User, Menu, Heart, X, CircleHelp } from "lucide-react";
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

export function SiteHeader() {
  const { user, status: authStatus } = useAuth();
  const { cartIconRef } = useCartFlight();
  const { items } = useCart();
  const { ids: wishIds } = useWishlist();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations("nav");
  const tb = useTranslations("brand");

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
      {/* Flipkart-style primary bar */}
      <div className="bg-[#2874f0] text-white">
        <div
          className={`${STORE_SHELL} flex flex-wrap items-center gap-2 py-2 md:gap-4 md:py-2.5`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 md:contents">
            <Link
              href="/"
              className="shrink-0 text-lg font-extrabold tracking-tight text-white md:text-xl"
            >
              <span className="italic">{tb("name")}</span>
            </Link>

            <button
              type="button"
              className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
              aria-label={t("menu")}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" strokeWidth={2} />
            </button>

            <div className="order-3 min-w-0 flex-1 md:order-none md:mx-2 md:max-w-2xl md:flex-1 lg:max-w-3xl">
              <SearchBar variant="flipkart" />
            </div>
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6">
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle variant="onPrimary" />
              <LanguageSwitcher variant="onPrimary" />
            </div>
            <NotificationInbox variant="onPrimary" />
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
              href="/admin"
              className="hidden px-2 text-sm font-semibold text-white hover:underline lg:block"
            >
              Admin
            </Link>
            <Link
              href="/wishlist"
              className="relative rounded-md p-2 text-white hover:bg-white/10 md:p-2.5"
              aria-label={t("wishlist")}
            >
              <Heart className="h-5 w-5" strokeWidth={2} />
              {wishIds.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6161] px-0.5 text-[10px] font-bold text-white">
                  {wishIds.length > 9 ? "9+" : wishIds.length}
                </span>
              )}
            </Link>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link
                ref={cartIconRef}
                href="/cart"
                className="relative flex flex-col items-center gap-0.5 px-1 text-[11px] font-medium text-white md:gap-0.5"
                aria-label={t("cart")}
              >
                <ShoppingCart className="h-6 w-6 md:h-5 md:w-5" strokeWidth={2} />
                <span className="hidden sm:inline">{t("cart")}</span>
                {count > 0 && (
                  <span className="absolute -right-0.5 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff9f00] px-1 text-[11px] font-extrabold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            </motion.div>
          </nav>
        </div>
      </div>

      {/* Category strip — white bar like Flipkart */}
      <div className="hidden border-b border-slate-200 bg-white shadow-sm md:block">
        <CategoryNav flipkartStyle />
      </div>

      {/* Mobile slide-out menu */}
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity md:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(100vw-3rem,300px)] flex-col bg-white shadow-xl transition-transform duration-300 ease-out md:hidden",
          drawerOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#2874f0] px-4 py-3 text-white">
          <span className="font-bold">{t("menu")}</span>
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-white/15"
            aria-label={t("closeMenu")}
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {authStatus === "ready" && user ? (
            <Link
              href="/account"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              onClick={() => setDrawerOpen(false)}
            >
              {t("account")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              onClick={() => setDrawerOpen(false)}
            >
              {t("login")}
            </Link>
          )}
          <Link
            href="/admin"
            className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            onClick={() => setDrawerOpen(false)}
          >
            Admin
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            onClick={() => setDrawerOpen(false)}
          >
            <CircleHelp className="h-4 w-4 text-[#2874f0]" />
            {t("helpSupport")}
          </Link>
          <div className="my-2 border-t border-slate-100" />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">
              {t("themeToggle")}
            </span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">Language</span>
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </header>
  );
}
