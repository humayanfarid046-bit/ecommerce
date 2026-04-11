"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  CircleUser,
  ClipboardList,
  Heart,
  Settings,
  CreditCard,
  Store,
  ChevronRight,
} from "lucide-react";

const iconMap = {
  CircleUser,
  ClipboardList,
  Heart,
  Settings,
  CreditCard,
  Store,
} as const;

type IconName = keyof typeof iconMap;

export function AccountSidebar({
  items,
}: {
  items: { href: string; label: string; icon: string }[];
}) {
  const pathname = usePathname();

  const resolved = items.map((i) => ({
    href: i.href,
    label: i.label,
    icon: iconMap[i.icon as IconName] ?? CircleUser,
  }));

  function navActive(href: string) {
    if (href === "/account") {
      return pathname === "/account" || pathname === "/account/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="w-full" aria-label="Account">
      <ul className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
        {resolved.map(({ href, label, icon: Icon }) => {
          const active = navActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "group flex items-center gap-3 border-b border-white/[0.06] px-3 py-3.5 transition last:border-b-0 sm:px-4 sm:py-3.5",
                  active
                    ? "bg-[#0066ff]/12 text-white"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
                    active
                      ? "border-[#0066ff]/45 bg-[#0066ff]/18 text-[#93c5fd]"
                      : "border-white/[0.08] bg-white/[0.05] text-slate-400 group-hover:border-white/15 group-hover:text-slate-200"
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.65} />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug tracking-[-0.01em]">
                  {label}
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300",
                    active && "text-[#7eb3ff]"
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
