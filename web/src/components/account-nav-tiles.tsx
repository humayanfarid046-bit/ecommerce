"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";

export type AccountNavTileItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AccountNavTiles({
  items,
  className,
}: {
  items: AccountNavTileItem[];
  className?: string;
}) {
  return (
    <nav className={cn("w-full", className)} aria-label="Account navigation">
      <ul className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-white/[0.09] dark:bg-white/[0.04] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-[52px] items-center gap-3 border-b border-[#EEEEEE] px-4 py-3 text-text-primary transition last:border-b-0 hover:bg-[#F0F7FF] active:bg-[#F0F7FF] dark:border-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEEEEE] bg-[#F8F9FA] text-text-primary transition group-hover:border-[#E0E0E0] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-400 dark:group-hover:border-white/15 dark:group-hover:text-slate-200">
                <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug tracking-[-0.01em]">
                {label}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300"
                strokeWidth={2.25}
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
