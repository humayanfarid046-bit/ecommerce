"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { useCartFlight } from "@/context/cart-flight-context";
import { getProductById, type Product } from "@/lib/storefront-catalog";
import { priceDropAmount } from "@/lib/wishlist-price-snapshot";
import { effectiveUnitPriceAfterCategoryDiscount } from "@/lib/category-discount-storage";
import { CategoryAwarePrice } from "@/components/category-aware-price";
import {
  readNotify,
  writeNotify,
  type NotifyPrefs,
} from "@/lib/wishlist-notify-storage";
import { getRecommendationsForWishlist } from "@/lib/wishlist-recommendations";
import { getTrustSignals } from "@/lib/product-trust";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { PRODUCT_GRID_COLS, STORE_SHELL } from "@/lib/store-layout";
import { useTranslations } from "next-intl";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Grid3x3,
  List,
  Share2,
  X,
  ShoppingCart,
  Star,
  Copy,
  CheckCheck,
} from "lucide-react";

const VIEW_KEY = "libas_wishlist_view_v1";
const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const COLORS = ["Black", "Navy", "Ivory", "Maroon", "Olive"] as const;

function readViewMode(): "grid" | "list" {
  if (typeof window === "undefined") return "grid";
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

type WishlistContentProps = {
  /** Hide page title when used inside account shell (title shown by parent). */
  embedded?: boolean;
};

export function WishlistContent({ embedded = false }: WishlistContentProps) {
  const { ids, remove } = useWishlist();
  const { addItem } = useCart();
  const { flyToCart } = useCartFlight();
  const t = useTranslations("wishlist");
  const addBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [variants, setVariants] = useState<
    Record<string, { size: string; color: string }>
  >({});
  const [notifyMap, setNotifyMap] = useState<Record<string, NotifyPrefs>>({});
  const [copied, setCopied] = useState(false);
  const [, setCatDiscTick] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const fn = () => setCatDiscTick((n) => n + 1);
    window.addEventListener("lc-category-discount", fn);
    return () => window.removeEventListener("lc-category-discount", fn);
  }, []);
  useEffect(() => {
    setViewMode(readViewMode());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode]);

  const products = useMemo(
    () =>
      ids
        .map((id) => getProductById(id))
        .filter(Boolean) as Product[],
    [ids]
  );

  useEffect(() => {
    setVariants((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id]) {
          next[id] = { size: "M", color: "Black" };
        }
      }
      return next;
    });
  }, [ids]);

  useEffect(() => {
    const m: Record<string, NotifyPrefs> = {};
    for (const id of ids) {
      m[id] = readNotify(id);
    }
    setNotifyMap(m);
  }, [ids]);

  const recs = useMemo(() => getRecommendationsForWishlist(ids, 5), [ids]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  }, [products, selected.size]);

  const setNotify = useCallback((productId: string, prefs: NotifyPrefs) => {
    writeNotify(productId, prefs);
    setNotifyMap((prev) => ({ ...prev, [productId]: prefs }));
  }, []);

  const handleAddToCart = useCallback(
    (p: Product) => {
      if (!p.inStock) return;
      const el = addBtnRefs.current[p.id];
      flyToCart(el, p.images[0]);
      addItem(p.id);
      window.setTimeout(() => remove(p.id), 620);
    },
    [addItem, flyToCart, remove]
  );

  const addSelectedToCart = useCallback(() => {
    const toAdd = products.filter((p) => selected.has(p.id) && p.inStock);
    if (!toAdd.length) return;
    const first = toAdd[0]!;
    flyToCart(addBtnRefs.current[first.id], first.images[0]);
    toAdd.forEach((p) => addItem(p.id));
    window.setTimeout(() => {
      toAdd.forEach((p) => remove(p.id));
    }, 620);
  }, [products, selected, addItem, remove, flyToCart]);

  const addAllInStock = useCallback(() => {
    const toAdd = products.filter((p) => p.inStock);
    if (!toAdd.length) return;
    const first = toAdd[0]!;
    flyToCart(addBtnRefs.current[first.id], first.images[0]);
    toAdd.forEach((p) => addItem(p.id));
    window.setTimeout(() => {
      toAdd.forEach((p) => remove(p.id));
    }, 620);
  }, [products, addItem, remove, flyToCart]);

  const shareWishlist = useCallback(async () => {
    const names = products.map((p) => p.title).slice(0, 6).join(", ");
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    const text = t("shareBody", { items: names || t("shareFallbackItems") });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle"),
          text: `${text}\n${url}`,
          url,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  }, [products, t]);

  const copyLink = useCallback(async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          `${STORE_SHELL} py-8 md:py-12`,
          !embedded && "px-4"
        )}
      >
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-4 w-72 animate-pulse rounded bg-neutral-100" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className={cn(
          `${STORE_SHELL} py-8 md:py-12`,
          !embedded && "px-4"
        )}
      >
        {!embedded ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
          </>
        ) : null}

        <div
          className={cn(
            "flex flex-col items-center rounded-3xl border border-neutral-200/80 bg-gradient-to-b from-rose-50/80 via-white to-[#0066ff]/5 px-6 py-14 text-center shadow-[0_24px_80px_rgba(0,102,255,0.08)]",
            embedded ? "mt-4" : "mt-12"
          )}
        >
          <div
            className="relative flex h-40 w-40 items-center justify-center"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-rose-200/60 via-white to-[#0066ff]/20 shadow-inner" />
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#7c3aed] opacity-40 blur-xl" />
            <Heart className="relative z-[1] h-24 w-24 fill-rose-400/90 text-rose-500 drop-shadow-lg" />
          </div>
          <p className="mt-6 max-w-md text-lg font-medium text-slate-800">
            {t("emptyTitle")}
          </p>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">{t("empty")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex min-w-[200px] justify-center rounded-2xl bg-[#0066ff] px-8 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(0,102,255,0.35)] transition hover:bg-[#0052cc]"
            >
              {t("startExploring")}
            </Link>
            <Link
              href="/"
              className="inline-flex min-w-[160px] justify-center rounded-2xl border-2 border-[#0066ff]/25 bg-white px-6 py-3 text-sm font-semibold text-[#0066ff] transition hover:bg-[#0066ff]/5"
            >
              {t("shopNow")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        `${STORE_SHELL} py-8 md:py-12`,
        !embedded && "px-4"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {!embedded ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
          </div>
        ) : (
          <div className="min-h-0 min-w-0 sm:flex-1" aria-hidden />
        )}

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={shareWishlist}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-neutral-50"
          >
            <Share2 className="h-4 w-4" />
            {t("share")}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-neutral-50"
          >
            {copied ? (
              <CheckCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? t("copied") : t("copyLink")}
          </button>
          <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 transition",
                viewMode === "grid"
                  ? "bg-white text-[#0066ff] shadow-sm"
                  : "text-neutral-500 hover:text-slate-800"
              )}
              aria-pressed={viewMode === "grid"}
              aria-label={t("viewGrid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 transition",
                viewMode === "list"
                  ? "bg-white text-[#0066ff] shadow-sm"
                  : "text-neutral-500 hover:text-slate-800"
              )}
              aria-pressed={viewMode === "list"}
              aria-label={t("viewList")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/60 px-4 py-3 backdrop-blur-sm">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.size === products.length && products.length > 0}
            onChange={selectAll}
            className="h-4 w-4 rounded border-neutral-300 text-[#0066ff] focus:ring-[#0066ff]"
          />
          {t("selectAll")}
        </label>
        <span className="hidden h-4 w-px bg-neutral-200 sm:inline" />
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={addSelectedToCart}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingCart className="h-4 w-4" />
          {t("addSelectedToCart")}
        </button>
        <button
          type="button"
          onClick={addAllInStock}
          className="text-sm font-medium text-[#0066ff] underline-offset-2 hover:underline"
        >
          {t("addAllInStock")}
        </button>
      </div>

      <ul
        className={cn(
          "mt-6",
          viewMode === "grid" ? PRODUCT_GRID_COLS : "flex flex-col gap-4"
        )}
      >
        <AnimatePresence initial={false}>
          {products.map((p) => {
            const currentUnit = effectiveUnitPriceAfterCategoryDiscount(
              p.price,
              p.categorySlug
            );
            const drop = priceDropAmount(p.id, currentUnit);
            const sig = getTrustSignals(p);
            const v = variants[p.id] ?? { size: "M", color: "Black" };
            const np = notifyMap[p.id] ?? {
              priceDrop: false,
              backInStock: false,
            };
            const list = viewMode === "list";

            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "glass relative rounded-2xl border border-neutral-200/80 p-4",
                  list && "flex gap-4"
                )}
              >
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="h-4 w-4 rounded border-neutral-300 text-[#0066ff]"
                    aria-label={t("selectItem")}
                  />
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={t("remove")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Link
                  href={`/product/${p.id}`}
                  className={cn(
                    "relative block shrink-0 overflow-hidden rounded-xl bg-neutral-100",
                    list ? "h-28 w-28" : "aspect-square w-full"
                  )}
                >
                  <Image
                    src={p.images[0]!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={list ? "112px" : "(max-width:768px) 100vw, 33vw"}
                  />
                  {drop != null && drop > 0 ? (
                    <span className="absolute bottom-2 left-2 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                      {t("priceDroppedBy", {
                        amount: drop.toLocaleString("en-IN"),
                      })}
                    </span>
                  ) : null}
                </Link>

                <div className="min-w-0 flex-1 pt-6 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        p.inStock
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {!p.inStock
                        ? t("outOfStock")
                        : sig.stockLeft <= 2
                          ? t("onlyLeft", { count: sig.stockLeft })
                          : t("inStock")}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      {p.rating}
                    </span>
                  </div>

                  <Link
                    href={`/product/${p.id}`}
                    className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 transition hover:text-[#0066ff]"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-neutral-500">{p.brand}</p>

                  <CategoryAwarePrice product={p} variant="wishlist" />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="flex items-center gap-1 text-xs text-neutral-600">
                      <span className="sr-only">{t("size")}</span>
                      <select
                        value={v.size}
                        onChange={(e) =>
                          setVariants((prev) => ({
                            ...prev,
                            [p.id]: { ...v, size: e.target.value },
                          }))
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-slate-900"
                      >
                        {SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-1 text-xs text-neutral-600">
                      <span className="sr-only">{t("color")}</span>
                      <select
                        value={v.color}
                        onChange={(e) =>
                          setVariants((prev) => ({
                            ...prev,
                            [p.id]: { ...v, color: e.target.value },
                          }))
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-slate-900"
                      >
                        {COLORS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNotify(p.id, {
                          ...np,
                          priceDrop: !np.priceDrop,
                        })
                      }
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                        np.priceDrop
                          ? "bg-[#0066ff] text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {t("notifyPrice")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNotify(p.id, {
                          ...np,
                          backInStock: !np.backInStock,
                        })
                      }
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                        np.backInStock
                          ? "bg-violet-600 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {t("notifyStock")}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    {t("notifyDemo")}
                  </p>

                  <button
                    ref={(el) => {
                      addBtnRefs.current[p.id] = el;
                    }}
                    type="button"
                    disabled={!p.inStock}
                    onClick={() => handleAddToCart(p)}
                    className={cn(
                      "mt-3 w-full rounded-xl py-2.5 text-sm font-bold transition sm:w-auto sm:min-w-[160px] sm:px-6",
                      p.inStock
                        ? "bg-[#0066ff] text-white shadow-[0_6px_20px_rgba(0,102,255,0.3)] hover:bg-[#0052cc]"
                        : "cursor-not-allowed bg-slate-200 text-slate-500"
                    )}
                  >
                    {p.inStock ? t("addToCart") : t("outOfStock")}
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {recs.length > 0 ? (
        <section className="mt-16 border-t border-neutral-200/80 pt-10">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("recommendationsTitle")}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {t("recommendationsSubtitle")}
          </p>
          <div className={`mt-6 ${PRODUCT_GRID_COLS}`}>
            {recs.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showTopOffer={false}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
