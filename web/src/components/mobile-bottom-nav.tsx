"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useMobileDrawer } from "@/context/mobile-drawer-context";

function BottomNavIconSlot({
  active,
  Icon,
  iconSlot,
}: {
  active: boolean;
  Icon: LucideIcon;
  /** Optional overlay (e.g. cart count badge) */
  iconSlot?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-xl px-2 py-1 transition-[background-color,color]",
        active
          ? "bg-[#2563eb]/14 text-[#2563eb] dark:bg-sky-400/12 dark:text-sky-200"
          : "text-slate-500 dark:text-slate-400"
      )}
    >
      <span className="relative inline-flex items-center justify-center">
        <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
        {iconSlot}
      </span>
    </span>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const t = useTranslations("nav");
  const { openDrawer, closeDrawer, drawerOpen, drawerMode } = useMobileDrawer();

  type Entry =
    | {
        kind: "link";
        href: string;
        label: string;
        Icon: LucideIcon;
        match: (p: string) => boolean;
      }
    | {
        kind: "drawer";
        label: string;
        Icon: LucideIcon;
        match: (p: string) => boolean;
      };

  const nav: Entry[] = [
    {
      kind: "link",
      href: "/",
      label: t("bottomHome"),
      Icon: Home,
      match: (p) => p === "/" || p === "",
    },
    {
      kind: "drawer",
      label: t("bottomCategories"),
      Icon: LayoutGrid,
      match: (p) => p.includes("/category"),
    },
    {
      kind: "link",
      href: "/cart",
      label: t("cart"),
      Icon: ShoppingCart,
      match: (p) => p.startsWith("/cart"),
    },
    {
      kind: "link",
      href: "/account",
      label: t("bottomAccount"),
      Icon: User,
      match: (p) => p.startsWith("/account"),
    },
  ];

  const shellClass = cn(
    "relative mx-auto flex w-full max-w-lg items-stretch justify-around gap-0.5 rounded-[20px] border px-1 py-2 backdrop-blur-2xl",
    "border-[rgba(37,99,235,0.16)] bg-white/95 shadow-[0_10px_36px_rgba(37,99,235,0.12)]",
    "dark:border-white/[0.09] dark:bg-[#0c1019]/72 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
  );

  const itemClass =
    "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 pb-0.5 pt-2 text-[9px] font-semibold leading-tight sm:text-[10px]";

  const tabTopIndicator = (active: boolean) => (
    <span
      className={cn(
        "absolute left-1/2 top-0 z-[1] h-[3px] w-10 -translate-x-1/2 rounded-b-full transition-opacity duration-200",
        active
          ? "bg-[#2563eb] opacity-100 dark:bg-sky-400"
          : "opacity-0"
      )}
      aria-hidden
    />
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[52] px-3 pt-2 lg:hidden"
      style={{
        paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))",
      }}
    >
      <nav
        className={cn(shellClass, "pointer-events-auto")}
        aria-label={t("bottomNavAria")}
      >
        {nav.map((item) => {
          const active = item.match(pathname);
          const Icon = item.Icon;
          if (item.kind === "drawer") {
            return (
              <button
                key="categories-drawer"
                type="button"
                onClick={() => {
                  if (drawerOpen && drawerMode === "categories") {
                    closeDrawer();
                  } else {
                    openDrawer("categories");
                  }
                }}
                className={cn(
                  itemClass,
                  active
                    ? "text-[#2563eb] dark:text-sky-200"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {tabTopIndicator(active)}
                <BottomNavIconSlot active={active} Icon={Icon} />
                <span className="line-clamp-2 max-w-full px-0.5 text-center">
                  {item.label}
                </span>
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => closeDrawer()}
              className={cn(
                itemClass,
                active
                  ? "text-[#2563eb] dark:text-sky-200"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {tabTopIndicator(active)}
              <BottomNavIconSlot
                active={active}
                Icon={Icon}
                iconSlot={
                  item.href === "/cart" && count > 0 ? (
                    <span className="absolute -right-1 -top-1 z-[1] flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6161] px-0.5 text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#0c1019]/95">
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null
                }
              />
              <span className="line-clamp-2 max-w-full px-0.5 text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
