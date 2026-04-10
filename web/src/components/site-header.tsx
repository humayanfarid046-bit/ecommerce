"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  User,
  Menu,
  Heart,
  CircleHelp,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { SearchBar } from "@/components/search-bar";
import { CategoryNav } from "@/components/category-nav";
import { NotificationInbox } from "@/components/notification-inbox";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORE_SHELL } from "@/lib/store-layout";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/context/wishlist-context";
import { useCartFlight } from "@/context/cart-flight-context";
import { useAuth } from "@/context/auth-context";
import { useMobileDrawer } from "@/context/mobile-drawer-context";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

export function SiteHeader() {
  const { user, status: authStatus } = useAuth();
  const { cartIconRef } = useCartFlight();
  const { items } = useCart();
  const { ids: wishIds } = useWishlist();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const { drawerOpen, openDrawer, closeDrawer } = useMobileDrawer();
  const t = useTranslations("nav");
  const tb = useTranslations("brand");

  return (
    <header className="sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
      <div className="bg-[#2874f0] text-white">
        <div
          className={`${STORE_SHELL} flex flex-col gap-2.5 py-2 md:flex-row md:flex-wrap md:items-center md:gap-4 md:py-2.5`}
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-2 md:contents">
            <div className="flex min-h-[44px] min-w-0 shrink-0 items-center gap-1.5 md:order-1 md:gap-2">
              <button
                type="button"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
                aria-label={t("menu")}
                onClick={() => openDrawer()}
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
              </button>
              <Link
                href="/"
                className="flex min-h-[44px] min-w-0 shrink-0 items-center text-base font-extrabold tracking-tight text-white min-[400px]:text-lg md:text-xl"
              >
                <span className="italic">{tb("name")}</span>
              </Link>
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

      <div className="hidden border-b border-slate-200 bg-white shadow-sm md:block">
        <CategoryNav flipkartStyle />
      </div>

      <MobileNavDrawer open={drawerOpen} onClose={closeDrawer} />
    </header>
  );
}
