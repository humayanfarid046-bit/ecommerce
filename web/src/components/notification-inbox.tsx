"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Bell, CheckCheck, Package, Tag, TrendingDown, Zap } from "lucide-react";
import { useNotifications } from "@/context/notifications-context";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { AppNotification } from "@/lib/notifications-storage";

function iconFor(n: AppNotification) {
  switch (n.type) {
    case "order":
      return Package;
    case "coupon":
      return Tag;
    case "price":
      return TrendingDown;
    case "stock":
      return Zap;
    default:
      return Bell;
  }
}

function formatNotification(
  n: AppNotification,
  t: (key: string, values?: Record<string, string>) => string
) {
  const v = n.values ?? {};
  switch (n.titleKey) {
    case "welcomeTitle":
      return { title: t("welcomeTitle"), body: t("welcomeBody") };
    case "orderSampleTitle":
      return { title: t("orderSampleTitle"), body: t("orderSampleBody") };
    case "orderPlacedTitle":
      return {
        title: t("orderPlacedTitle"),
        body: t("orderPlacedBody", {
          orderId: v.orderId ?? "",
          amount: v.amount ?? "",
          method: v.method ?? "",
        }),
      };
    case "priceDropTitle":
      return {
        title: t("priceDropTitle"),
        body: t("priceDropBody", {
          productName: v.productName ?? "",
          amount: v.amount ?? "",
        }),
      };
    case "hurryUpTitle":
      return {
        title: t("hurryUpTitle"),
        body: t("hurryUpBody", {
          productName: v.productName ?? "",
          stockLeft: v.stockLeft ?? "",
        }),
      };
    default:
      return { title: n.titleKey, body: n.bodyKey };
  }
}

type InboxProps = { variant?: "default" | "onPrimary" };

export function NotificationInbox({ variant = "default" }: InboxProps) {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("notifications");
  const router = useRouter();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative rounded-full p-2.5 transition",
          variant === "onPrimary"
            ? "text-white hover:bg-white/15"
            : "text-[var(--electric)] hover:bg-slate-100 hover:text-[var(--electric-hover)]"
        )}
        aria-label={t("inboxAria")}
        aria-expanded={open}
      >
        <Bell className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white",
              variant === "onPrimary" ? "bg-[#ff6161]" : "bg-[#0066ff]"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-[80] mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(0,102,255,0.18)] dark:border-slate-700 dark:bg-slate-900"
          role="dialog"
          aria-label={t("inboxTitle")}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t("inboxTitle")}
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0066ff] hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t("markAllRead")}
              </button>
            ) : null}
          </div>
          <ul className="max-h-[min(70vh,420px)] overflow-y-auto">
            {sorted.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-neutral-500">
                {t("empty")}
              </li>
            ) : (
              sorted.map((n) => {
                const Icon = iconFor(n);
                const { title, body } = formatNotification(n, t);
                return (
                  <li key={n.id}>
                    <div
                      className={cn(
                        "flex gap-3 border-b border-slate-50 px-4 py-3 dark:border-slate-800",
                        !n.read && "bg-[#0066ff]/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          n.type === "order" &&
                            "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
                          n.type === "coupon" &&
                            "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
                          n.type === "price" &&
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {title}
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                          {body}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {n.type === "order" ? (
                            <Link
                              href="/account/orders"
                              className="text-[11px] font-bold text-[#0066ff] hover:underline"
                              onClick={() => {
                                markRead(n.id);
                                setOpen(false);
                              }}
                            >
                              {t("viewOrders")}
                            </Link>
                          ) : null}
                          {n.type === "price" && n.productId ? (
                            <button
                              type="button"
                              className="text-[11px] font-bold text-[#0066ff] hover:underline"
                              onClick={() => {
                                markRead(n.id);
                                setOpen(false);
                                router.push(`/product/${n.productId}`);
                              }}
                            >
                              {t("viewProduct")}
                            </button>
                          ) : null}
                          {!n.read ? (
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-neutral-500 hover:text-slate-800"
                              onClick={() => markRead(n.id)}
                            >
                              {t("dismissRead")}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
