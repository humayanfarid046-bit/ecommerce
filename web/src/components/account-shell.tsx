"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { AccountSidebar } from "@/components/account-sidebar";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { permissionsForScope } from "@/lib/panel-access";

const NAV_ICONS = [
  "LayoutDashboard",
  "Package",
  "Heart",
  "Settings",
  "CreditCard",
] as const;

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, signOut, status } = useAuth();
  const t = useTranslations("account");

  const showManageStore = useMemo(() => {
    if (!user?.accessScopeReady) return false;
    const p = permissionsForScope(user.accessScope ?? "none");
    return Object.values(p).some(Boolean);
  }, [user?.accessScope, user?.accessScopeReady]);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-16 text-center sm:px-4">
        <p className="text-sm text-slate-500">{t("sessionLoading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-lg px-3 py-12 sm:px-4 sm:py-16">
        <div className="glass rounded-2xl p-6 text-center sm:p-8">
          <p className="text-slate-600">{t("signInPrompt")}</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-[#0066ff] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0066ff]/25 hover:bg-[#0052cc]"
          >
            {t("loginSignup")}
          </Link>
        </div>
      </div>
    );
  }

  const items = [
    { href: "/account", label: t("navOverview"), icon: NAV_ICONS[0] },
    { href: "/account/orders", label: t("navOrders"), icon: NAV_ICONS[1] },
    { href: "/account/wishlist", label: t("navWishlist"), icon: NAV_ICONS[2] },
    { href: "/account/settings", label: t("navSettings"), icon: NAV_ICONS[3] },
    { href: "/account/payments", label: t("navPayments"), icon: NAV_ICONS[4] },
    ...(showManageStore
      ? [
          {
            href: "/admin",
            label: t("navManageStore"),
            icon: "Store" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-6 sm:px-4 md:px-6 md:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("signedInAs")}
          </p>
          <p className="mt-0.5 break-words text-sm font-medium text-slate-800 dark:text-slate-100">
            {user.email ?? user.uid}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="w-full shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {t("signOut")}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:mt-8 lg:flex-row lg:gap-10">
        <div className="w-full min-w-0 lg:w-56 lg:shrink-0">
          <AccountSidebar items={items} />
        </div>
        <main className="min-w-0 w-full flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
