"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "@/i18n/navigation";
import { LogOut } from "lucide-react";

/** Minimal top bar for delivery partner routes (no storefront nav). */
export function DeliveryPartnerAppBar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-700/80 bg-slate-950/95 px-4 py-3 backdrop-blur">
      <div>
        <p className="text-sm font-black tracking-tight text-white">Delivery</p>
        {user?.email ? (
          <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-400">
            {user.email}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.replace("/login");
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Sign out
      </button>
    </header>
  );
}
