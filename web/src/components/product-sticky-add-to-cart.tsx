"use client";

import { useRef } from "react";
import { useCart } from "@/context/cart-context";
import { useCartFlight } from "@/context/cart-flight-context";
import { getProductById } from "@/lib/storefront-catalog";
import { RippleButton } from "@/components/ripple-button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  productId: string;
  inStock: boolean;
};

/**
 * Mobile-only sticky bar above the bottom tab nav — keeps primary CTA in reach while scrolling.
 */
export function ProductStickyAddToCart({ productId, inStock }: Props) {
  const { addItem } = useCart();
  const { flyToCart } = useCartFlight();
  const btnRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("product");
  const p = getProductById(productId);
  const img = p?.images[0];

  return (
    <div
      className="fixed left-0 right-0 z-[53] border-t border-[#E5E7EB] bg-white/95 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 lg:hidden"
      style={{
        bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <RippleButton
          ref={btnRef}
          disabled={!inStock}
          onClick={() => {
            flyToCart(btnRef.current, img);
            addItem(productId);
          }}
          rippleClassName="bg-white/30"
          className={
            inStock
              ? "min-h-[48px] flex-1 rounded-xl bg-[#2874f0] py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#1a65d8]"
              : "min-h-[48px] flex-1 cursor-not-allowed rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-500"
          }
        >
          {inStock ? t("addToCart") : t("outOfStock")}
        </RippleButton>
        <Link
          href="/cart"
          className="flex min-h-[48px] shrink-0 items-center rounded-xl border-2 border-[#2874f0]/35 px-4 text-sm font-bold text-[#2874f0]"
        >
          {t("goToCart")}
        </Link>
      </div>
    </div>
  );
}
