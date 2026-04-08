"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { setSnapshot } from "@/lib/wishlist-price-snapshot";
import { getProductById } from "@/lib/mock-data";
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
    return lines.reduce((s, l) => s + effectiveLineTotalRupees(l.product, l.qty), 0);
  }, [lines, catDiscTick]);

  const delivery = useMemo(() => {
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
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {t("title")}
      </h1>
      {lines.length === 0 ? (
        <div className="mt-8 glass rounded-2xl p-8 text-center">
          <p className="text-neutral-500">{t("empty")}</p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-xl bg-[#0066ff] px-6 py-2 text-sm font-medium text-white hover:bg-[#0052cc]"
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
                className="glass flex gap-4 rounded-2xl p-4"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100"
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
                    <h2 className="font-medium text-slate-900 transition hover:text-[#0066ff]">
                      {product.title}
                    </h2>
                  </Link>
                  <p className="mt-1 text-sm text-neutral-500">{product.brand}</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {showCatDisc ? (
                      <>
                        <span className="mr-2 text-neutral-400 line-through">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        <span>₹{unit.toLocaleString("en-IN")}</span>
                      </>
                    ) : (
                      <>₹{unit.toLocaleString("en-IN")}</>
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-neutral-600">
                      {t("qty")}
                      <select
                        value={qty}
                        onChange={(e) =>
                          setQty(product.id, Number(e.target.value))
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-slate-900"
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
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#0066ff] hover:text-[#0052cc]"
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
            <div className="rounded-2xl border border-dashed border-[#0066ff]/35 bg-gradient-to-br from-[#0066ff]/[0.06] to-transparent p-6">
              <h2 className="text-base font-semibold text-slate-900">
                {t("saveForLaterTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {t("saveForLaterSubtitle")}
              </p>
              <Link
                href="/wishlist"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0066ff] shadow-sm ring-1 ring-[#0066ff]/20 transition hover:bg-[#0066ff]/5"
              >
                <Heart className="h-4 w-4" />
                {t("wishlistLink")}
              </Link>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-1">
            <div className="glass rounded-2xl p-4">
              <label className="text-xs font-medium uppercase text-neutral-500">
                {t("coupon")}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder={t("couponPlaceholder")}
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-slate-900 hover:bg-neutral-100"
                >
                  {t("apply")}
                </button>
              </div>
              <p className="mt-2 text-xs text-neutral-500">{t("couponHint")}</p>
            </div>
            <PriceSummary
              itemTotal={itemTotal}
              delivery={delivery}
              discount={applied}
            />
            <Link
              href="/checkout"
              className="block w-full rounded-2xl bg-[#0066ff] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0052cc]"
            >
              {t("proceedCheckout")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
