"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { AccountSidebar } from "@/components/account-sidebar";
import { useTranslations } from "next-intl";

const NAV_ICONS = [
  "LayoutDashboard",
  "Package",
  "Heart",
  "Settings",
  "CreditCard",
] as const;

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const t = useTranslations("account");

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="glass rounded-2xl p-8 text-center">
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
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("signedInAs")}
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-800">
            {user.email ?? user.uid}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {t("signOut")}
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:gap-10">
        <div className="lg:w-56 lg:shrink-0">
          <AccountSidebar items={items} />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
