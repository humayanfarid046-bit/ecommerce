"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { setSnapshot } from "@/lib/wishlist-price-snapshot";
import { getProductById } from "@/lib/storefront-catalog";
import type { Product } from "@/lib/product-model";
import { computeDeliveryQuote } from "@/lib/shipping-rules-storage";
import {
  effectiveLineTotalRupees,
  effectiveUnitPriceAfterCategoryDiscount,
} from "@/lib/category-discount-storage";
import { PriceSummary } from "@/components/price-summary";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { CartExitIntent } from "@/components/cart-exit-intent";

export default function CartPage() {
  const { items, setQty, removeItem } = useCart();
  const { has, toggle } = useWishlist();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(0);
  const [shipTick, setShipTick] = useState(0);
  const [catDiscTick, setCatDiscTick] = useState(0);
  const t = useTranslations("cart");

  useEffect(() => {
    const fn = () => setShipTick((n) => n + 1);
    window.addEventListener("lc-shipping-rules", fn);
    return () => window.removeEventListener("lc-shipping-rules", fn);
  }, []);

  useEffect(() => {
    const fn = () => setCatDiscTick((n) => n + 1);
    window.addEventListener("lc-category-discount", fn);
    return () => window.removeEventListener("lc-category-discount", fn);
  }, []);

  const lines = useMemo(() => {
    return items
      .map((i) => {
        const p = getProductById(i.productId);
        return p ? { ...i, product: p } : null;
      })
      .filter(Boolean) as {
        productId: string;
        qty: number;
        product: Product;
      }[];
  }, [items]);

  const itemTotal = useMemo(() => {
    void catDiscTick;
    return lines.reduce((s, l) => s + effectiveLineTotalRupees(l.product, l.qty), 0);
  }, [lines, catDiscTick]);

  const delivery = useMemo(() => {
    void shipTick;
    if (itemTotal === 0) return 0;
    const q = computeDeliveryQuote(itemTotal, "", false);
    return q.deliveryFee;
  }, [itemTotal, shipTick]);

  function moveToWishlist(productId: string) {
    const p = getProductById(productId);
    removeItem(productId);
    if (p && !has(productId)) {
      setSnapshot(productId, p.price);
      toggle(productId);
    }
  }

  function applyCoupon() {
    const c = coupon.trim().toUpperCase();
    if (c === "SAVE10") setApplied(Math.round(itemTotal * 0.1));
    else if (c === "FLAT100" && itemTotal >= 500) setApplied(100);
    else setApplied(0);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {lines.length > 0 ? <CartExitIntent /> : null}
      <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-slate-100">
        {t("title")}
      </h1>
      {lines.length === 0 ? (
        <div className="mt-8 glass rounded-[18px] p-8 text-center">
          <p className="font-medium text-text-secondary dark:text-slate-400">{t("empty")}</p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-[12px] bg-gradient-to-br from-[#2f84ff] via-[#2874f0] to-[#1a5fd4] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2874f0]/25 hover:brightness-105"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {lines.map(({ product, qty }) => {
              const unit = effectiveUnitPriceAfterCategoryDiscount(
                product.price,
                product.categorySlug
              );
              const showCatDisc = unit < product.price;
              return (
              <motion.div
                layout
                key={product.id}
                className="glass flex gap-4 rounded-[18px] p-4"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-slate-800"
                >
                  <Image
                    src={product.images[0]!}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${product.id}`}>
                    <h2 className="font-semibold text-text-primary transition hover:text-[#0066ff] dark:text-slate-100 dark:hover:text-[#7eb3ff]">
                      {product.title}
                    </h2>
                  </Link>
                  <p className="mt-1 text-sm font-medium text-text-secondary dark:text-slate-400">{product.brand}</p>
                  <p className="mt-2 font-bold text-text-primary dark:text-slate-100">
                    {showCatDisc ? (
                      <>
                        <span className="mr-2 font-medium text-text-secondary line-through decoration-text-secondary/80 dark:text-slate-500">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        <span>₹{unit.toLocaleString("en-IN")}</span>
                      </>
                    ) : (
                      <>₹{unit.toLocaleString("en-IN")}</>
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-text-secondary dark:text-slate-300">
                      {t("qty")}
                      <select
                        value={qty}
                        onChange={(e) =>
                          setQty(product.id, Number(e.target.value))
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 font-medium text-text-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => moveToWishlist(product.id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#0066ff] hover:text-[#0052cc] dark:text-[#7eb3ff] dark:hover:text-[#93c5fd]"
                    >
                      <Heart className="h-4 w-4" />
                      {t("moveToWishlist")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
            })}
            <div className="rounded-[18px] border border-dashed border-[#0066ff]/35 bg-gradient-to-br from-[#0066ff]/[0.06] to-transparent p-6 dark:border-[#0066ff]/25 dark:from-[#0066ff]/10">
              <h2 className="text-base font-semibold text-text-primary dark:text-slate-100">
                {t("saveForLaterTitle")}
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-secondary dark:text-slate-400">
                {t("saveForLaterSubtitle")}
              </p>
              <Link
                href="/wishlist"
                className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2.5 text-sm font-semibold text-[#0066ff] shadow-sm ring-1 ring-[#0066ff]/20 transition hover:bg-[#0066ff]/5 dark:bg-slate-800 dark:text-[#7eb3ff] dark:ring-[#0066ff]/35 dark:hover:bg-slate-700/80"
              >
                <Heart className="h-4 w-4" />
                {t("wishlistLink")}
              </Link>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-1">
            <div className="glass rounded-[18px] p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-slate-400">
                {t("coupon")}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder={t("couponPlaceholder")}
                  className="min-w-0 flex-1 rounded-[12px] border border-transparent bg-[var(--input-fill,#edf0f4)] px-3 py-2 text-sm font-medium text-text-primary outline-none focus:border-[#0066ff]/40 focus:ring-2 focus:ring-[#0066ff]/12 dark:bg-[var(--input-fill)] dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-[12px] border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-text-primary hover:bg-neutral-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t("apply")}
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-text-secondary dark:text-slate-400">{t("couponHint")}</p>
            </div>
            <PriceSummary
              itemTotal={itemTotal}
              delivery={delivery}
              discount={applied}
            />
            <Link
              href="/checkout"
              className="block w-full rounded-[12px] bg-gradient-to-br from-[#2f84ff] via-[#2874f0] to-[#1a5fd4] py-3 text-center text-sm font-semibold text-white shadow-md shadow-[#2874f0]/25 transition hover:brightness-105 dark:shadow-[#2874f0]/20"
            >
              {t("proceedCheckout")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
