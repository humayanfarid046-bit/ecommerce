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
    <span className="relative flex flex-col items-center gap-0.5">
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl px-2 py-1 transition-[box-shadow,background-color,color]",
          active
            ? "bg-sky-400/12 text-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.35),0_0_1px_rgba(56,189,248,0.5)]"
            : "text-slate-400"
        )}
      >
        <span className="relative inline-flex items-center justify-center">
          <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
          {iconSlot}
        </span>
      </span>
      <span className="flex h-1.5 items-center justify-center" aria-hidden>
        <span
          className={cn(
            "rounded-full transition-[opacity,box-shadow,transform]",
            active
              ? "h-1.5 w-1.5 scale-100 bg-sky-400 opacity-100 shadow-[0_0_10px_rgba(56,189,248,0.85)]"
              : "h-1 w-1 scale-75 opacity-0"
          )}
        />
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

  const shellClass =
    "relative mx-auto flex w-full max-w-lg items-stretch justify-around gap-0.5 rounded-[20px] border border-white/12 bg-white/[0.12] px-1 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-[#0c1019]/72";

  const itemClass =
    "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0 px-0.5 pb-0.5 pt-1 text-[9px] font-semibold leading-tight sm:text-[10px]";

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
                  active ? "text-sky-200" : "text-slate-400"
                )}
              >
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
                active ? "text-sky-200" : "text-slate-400"
              )}
            >
              <BottomNavIconSlot
                active={active}
                Icon={Icon}
                iconSlot={
                  item.href === "/cart" && count > 0 ? (
                    <span className="absolute -right-1 -top-1 z-[1] flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6161] px-0.5 text-[9px] font-bold text-white ring-2 ring-[#0c1019]/90 dark:ring-[#0c1019]/95">
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
