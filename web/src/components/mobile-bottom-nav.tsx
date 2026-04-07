"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const t = useTranslations("nav");

  const nav = [
    { href: "/", label: t("bottomHome"), Icon: Home, match: (p: string) => p === "/" },
    {
      href: "/search",
      label: t("bottomCategories"),
      Icon: LayoutGrid,
      match: (p: string) =>
        p.startsWith("/search") || p.startsWith("/category"),
    },
    {
      href: "/cart",
      label: t("cart"),
      Icon: ShoppingCart,
      match: (p: string) => p.startsWith("/cart"),
    },
    {
      href: "/account",
      label: t("bottomAccount"),
      Icon: User,
      match: (p: string) => p.startsWith("/account"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[52] flex items-stretch justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] lg:hidden"
      aria-label={t("bottomNavAria")}
    >
      {nav.map(({ href, label, Icon, match }) => {
        const active = pathname ? match(pathname) : false;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
              active ? "text-[#2874f0]" : "text-slate-600"
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {href === "/cart" && count > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6161] px-0.5 text-[9px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </span>
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
