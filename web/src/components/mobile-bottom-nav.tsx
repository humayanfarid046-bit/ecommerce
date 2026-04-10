"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { Home, LayoutGrid, Gift, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useMobileDrawer } from "@/context/mobile-drawer-context";

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";
  const t = useTranslations("nav");
  const { openDrawer } = useMobileDrawer();

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

  /** Home → Categories (drawer) → Rewards (loyalty / spin) → Account. Cart stays in header. */
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
      href: "/rewards",
      label: t("bottomRewards"),
      Icon: Gift,
      match: (p) => p.startsWith("/rewards"),
    },
    {
      kind: "link",
      href: "/account",
      label: t("bottomAccount"),
      Icon: User,
      match: (p) => p.startsWith("/account"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[52] flex min-h-[calc(3.25rem+env(safe-area-inset-bottom))] items-stretch justify-around border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)] pt-1.5 text-slate-400 shadow-[0_-4px_16px_rgba(0,0,0,0.35)] lg:hidden"
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
              onClick={() => openDrawer()}
              className={cn(
                "relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-semibold leading-tight sm:text-[10px]",
                active ? "text-[#5ab0ff]" : "text-slate-400"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
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
            className={cn(
              "relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-semibold leading-tight sm:text-[10px]",
              active ? "text-[#5ab0ff]" : "text-slate-400"
            )}
          >
            <span className="relative inline-flex items-center justify-center">
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
            </span>
            <span className="line-clamp-2 max-w-full px-0.5 text-center">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
