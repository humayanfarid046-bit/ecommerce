"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  PanelsTopLeft,
  Settings,
  Headphones,
  Search,
  Menu,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  pathnameToAdminModule,
  type AdminModule,
  logAdminSessionOpen,
} from "@/lib/admin-security-storage";
import { permissionsForScope } from "@/lib/panel-access";
import { useAuth } from "@/context/auth-context";

const nav: {
  href: string;
  key: string;
  icon: typeof LayoutDashboard;
  module: AdminModule;
}[] = [
  { href: "/admin", key: "navDashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/admin/products", key: "navProducts", icon: Package, module: "products" },
  { href: "/admin/orders", key: "navOrders", icon: ShoppingBag, module: "orders" },
  { href: "/admin/users", key: "navUsers", icon: Users, module: "users" },
  { href: "/admin/payments", key: "navPayments", icon: CreditCard, module: "payments" },
  { href: "/admin/content", key: "navContent", icon: PanelsTopLeft, module: "content" },
  { href: "/admin/settings", key: "navSettings", icon: Settings, module: "settings" },
  { href: "/admin/support", key: "navSupport", icon: Headphones, module: "support" },
  { href: "/admin/seo", key: "navSeo", icon: Search, module: "seo" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const { user, status, signOut } = useAuth();

  useEffect(() => {
    logAdminSessionOpen();
  }, []);

  const perm = useMemo(() => permissionsForScope(user?.accessScope ?? "none"), [user?.accessScope]);
  const visibleNav = useMemo(() => nav.filter((item) => perm[item.module]), [perm]);

  const currentModule = pathnameToAdminModule(pathname ?? "");
  const allowedHere = perm[currentModule];

  useEffect(() => {
    if (status !== "ready") return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedHere) {
      router.replace("/");
    }
  }, [status, user, allowedHere, router]);

  return (
    <div className="min-h-[calc(100vh-0px)] bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
            <Link
              href="/admin"
              className="text-sm font-extrabold text-[#0066ff]"
              onClick={() => setOpen(false)}
            >
              {t("brand")}
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 lg:hidden"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-0.5 p-3">
            {visibleNav.map((item) => {
              const p = pathname ?? "";
              const activeResolved =
                item.href === "/admin"
                  ? pathnameToAdminModule(p) === "dashboard"
                  : p.includes(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    activeResolved
                      ? "bg-[#0066ff]/12 text-[#0066ff]"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <p className="mt-4 px-4 text-[10px] font-medium text-slate-400">
            {t("demoNote")}
          </p>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            aria-label="Close overlay"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <button
              type="button"
              className="rounded-lg p-2 lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t("consoleTitle")}
            </h1>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => {
                  void (async () => {
                    await signOut();
                    router.replace("/login");
                    router.refresh();
                  })();
                }}
              >
                {t("logoutAdmin")}
              </button>
              <Link
                href="/"
                className="text-xs font-bold text-[#0066ff] hover:underline"
              >
                {t("backStore")}
              </Link>
            </div>
          </header>
          <main className="p-4 md:p-6">
            {allowedHere ? (
              children
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
                <p className="text-lg font-extrabold text-rose-800 dark:text-rose-200">
                  {t("accessDenied")}
                </p>
                <p className="mt-2 text-sm text-rose-700/90 dark:text-rose-300/90">
                  {t("accessDeniedHint")}
                </p>
                <Link
                  href="/admin"
                  className="mt-6 inline-block rounded-xl bg-[#0066ff] px-5 py-2.5 text-sm font-bold text-white"
                >
                  {t("backToDashboard")}
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
