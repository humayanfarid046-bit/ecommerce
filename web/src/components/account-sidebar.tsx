"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Heart,
  Settings,
  CreditCard,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export function AccountSidebar({
  items,
}: {
  items: { href: string; label: string; icon: string }[];
}) {
  const pathname = usePathname();
  const iconMap = {
    LayoutDashboard,
    Package,
    Heart,
    Settings,
    CreditCard,
  } as const;

  const resolved: Item[] = items.map((i) => ({
    href: i.href,
    label: i.label,
    icon: iconMap[i.icon as keyof typeof iconMap] ?? LayoutDashboard,
  }));

  function navActive(href: string) {
    if (href === "/account") {
      return pathname === "/account" || pathname === "/account/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav
        className="flex gap-1 overflow-x-auto pb-1 lg:hidden"
        aria-label="Account"
      >
        {resolved.map(({ href, label, icon: Icon }) => {
          const active = navActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition",
                active
                  ? "bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <aside className="hidden w-56 shrink-0 lg:block">
        <nav
          className="glass sticky top-24 space-y-1 rounded-2xl border border-slate-200/80 p-2"
          aria-label="Account"
        >
          {resolved.map(({ href, label, icon: Icon }) => {
            const active = navActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-[#0066ff]/10 text-[#0066ff]"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
