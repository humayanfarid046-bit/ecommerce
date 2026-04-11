"use client";

import { useRef } from "react";
import { useCart } from "@/context/cart-context";
import { useCartFlight } from "@/context/cart-flight-context";
import { getProductById } from "@/lib/storefront-catalog";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProductWishlistToggle } from "@/components/product-wishlist-toggle";
import { RippleButton } from "@/components/ripple-button";
import { useCompare } from "@/context/compare-context";
import { Scale } from "lucide-react";
import { useEffectiveUnitPrice } from "@/components/category-aware-price";

type Props = { productId: string; inStock: boolean };

export function ProductActions({ productId, inStock }: Props) {
  const { addItem } = useCart();
  const { flyToCart } = useCartFlight();
  const { add: addCompare, has } = useCompare();
  const btnRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("product");
  const p = getProductById(productId);
  const wishlistPrice = useEffectiveUnitPrice(
    p ? { price: p.price, categorySlug: p.categorySlug } : { price: 0, categorySlug: "" }
  );

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <RippleButton
        ref={btnRef}
        disabled={!inStock}
        onClick={() => {
          flyToCart(btnRef.current, p?.images[0]);
          addItem(productId);
        }}
        rippleClassName="bg-white/30"
        className={
          inStock
            ? "rounded-[12px] bg-[#2874f0] px-8 py-3 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(40,116,240,0.35)] transition hover:bg-[#1a65d8]"
            : "cursor-not-allowed rounded-[12px] bg-slate-200 px-8 py-3 text-sm font-bold text-slate-500"
        }
      >
        {t("addToCart")}
      </RippleButton>
      <Link
        href="/cart"
        className="rounded-[12px] border-2 border-[#2874f0]/30 bg-white px-8 py-3 text-sm font-bold text-[#2874f0] transition hover:bg-[#2874f0]/5"
      >
        {t("goToCart")}
      </Link>
      <ProductWishlistToggle productId={productId} price={wishlistPrice} />
      <button
        type="button"
        onClick={() => addCompare(productId)}
        className={cn(
          "inline-flex items-center gap-2 rounded-[12px] border-2 px-5 py-3 text-sm font-bold transition",
          has(productId)
            ? "border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-slate-200 bg-white text-slate-700 hover:border-[#2874f0]/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        )}
        aria-pressed={has(productId)}
      >
        <Scale className="h-4 w-4" />
        {has(productId) ? t("compareAdded") : t("compare")}
      </button>
    </div>
  );
}
