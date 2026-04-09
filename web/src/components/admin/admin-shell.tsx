"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
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
  { href: "/admin/inventory", key: "navInventory", icon: Boxes, module: "inventory" },
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
      router.replace("/");
      return;
    }
    if (!user.accessScopeReady) return;
    if (!allowedHere) {
      router.replace("/");
    }
  }, [status, user, allowedHere, router]);

  if (status !== "ready" || !user || !user.accessScopeReady) {
    return (
      <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.15),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.2),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.2),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <p className="rounded-2xl border border-white/50 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200">
          {!user ? "Signing out..." : t("loadingPermissions")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-0px)] bg-[radial-gradient(circle_at_12%_12%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] dark:bg-[radial-gradient(circle_at_12%_12%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.16),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-sky-100/80 bg-gradient-to-b from-white via-sky-50/70 to-indigo-50/70 shadow-2xl shadow-sky-100/50 transition-transform dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20 lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-sky-100/80 px-5 dark:border-slate-800">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#0066ff] to-[#7c3aed] bg-clip-text text-sm font-extrabold tracking-wide text-transparent"
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
          <nav className="space-y-1 p-3.5">
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
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                    activeResolved
                      ? "border-transparent bg-gradient-to-r from-[#0066ff] to-[#7c3aed] text-white shadow-lg shadow-indigo-300/35 dark:shadow-indigo-950/40"
                      : "border-transparent text-slate-700 hover:border-sky-100 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition",
                      activeResolved ? "text-white" : "text-sky-600 group-hover:text-indigo-600 dark:text-sky-300"
                    )}
                  />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <p className="mt-4 px-4 text-[10px] font-medium uppercase tracking-wider text-slate-400/90">
            {t("workspaceNote")}
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
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sky-100/70 bg-white/70 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/65">
            <button
              type="button"
              className="rounded-lg border border-slate-200/80 bg-white/80 p-2 shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-800/80"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-slate-100">
              {t("consoleTitle")}
            </h1>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 md:inline-flex dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              Live workspace
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-300 dark:hover:text-white"
                onClick={() => {
                  void (async () => {
                    await signOut();
                    router.replace("/");
                    router.refresh();
                  })();
                }}
              >
                {t("logoutAdmin")}
              </button>
              <Link
                href="/"
                className="rounded-lg bg-gradient-to-r from-[#0066ff] to-[#7c3aed] px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-300/40 transition hover:opacity-95 dark:shadow-indigo-950/40"
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
