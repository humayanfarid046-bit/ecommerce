"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { RippleButton } from "@/components/ripple-button";
import { Heart, Scale, Star } from "lucide-react";
import type { Product } from "@/lib/product-model";
import { useCart } from "@/context/cart-context";
import { useCartFlight } from "@/context/cart-flight-context";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/context/wishlist-context";
import { useCompare } from "@/context/compare-context";
import { setSnapshot } from "@/lib/wishlist-price-snapshot";
import { useRef } from "react";
import {
  CategoryAwarePrice,
  useEffectiveUnitPrice,
} from "@/components/category-aware-price";

type Props = {
  product: Product;
  className?: string;
  /** Show animated “Top offer” badge (e.g. home featured grid). */
  showTopOffer?: boolean;
};

export function ProductCard({
  product,
  className,
  showTopOffer = true,
}: Props) {
  const { addItem } = useCart();
  const { flyToCart } = useCartFlight();
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const { toggle: toggleWish, has } = useWishlist();
  const { add: addCompare, has: inCompare } = useCompare();
  const wish = has(product.id);
  const t = useTranslations("productCard");
  const effectiveUnit = useEffectiveUnitPrice(product);
  const second = product.images[1];

  return (
    <article
      className={cn(
        "product-card-store group relative flex flex-col overflow-hidden rounded-md",
        className
      )}
    >
      <div className="product-card-image-well relative aspect-[3/4] w-full max-h-[min(46vw,210px)] min-h-0 overflow-hidden sm:max-h-none">
        <Link
          href={`/product/${product.id}`}
          className="absolute inset-0 block"
          aria-label={product.title}
        >
          <div className="absolute inset-0 p-1.5 sm:p-2">
            <div className="relative h-full w-full">
              <Image
                src={product.images[0] ?? "/vercel.svg"}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 200px"
                className={cn(
                  "object-contain transition duration-300 ease-out group-hover:scale-[1.03]",
                  second && "group-hover:opacity-0"
                )}
              />
              {second ? (
                <Image
                  src={second}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 200px"
                  className="object-contain opacity-0 transition duration-300 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
                />
              ) : null}
            </div>
          </div>

          {showTopOffer && (
            <div className="pointer-events-none absolute left-2 top-2 rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-200">
              {t("topOffer")}
            </div>
          )}

          {product.discountPct > 0 && (
            <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              {product.discountPct}% {t("off")}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!wish) setSnapshot(product.id, effectiveUnit);
            toggleWish(product.id);
          }}
          className={cn(
            "absolute right-2 top-2 z-10 rounded-full bg-white/95 p-1.5 shadow-sm ring-1 ring-[#E5E7EB] transition-colors hover:bg-white dark:bg-slate-800/95 dark:ring-slate-600 dark:hover:bg-slate-700",
            wish
              ? "text-rose-500"
              : "text-slate-400 hover:text-rose-500"
          )}
          aria-label={t("wishlist")}
        >
          <Heart className={cn("h-4 w-4", wish && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-[#E5E7EB] p-2 text-left dark:border-slate-600/70 sm:gap-1.5 sm:p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-[10px]">
          {product.brand}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-[11px] font-medium leading-snug text-[#1F2937] transition hover:text-[#2874f0] dark:text-slate-100 dark:hover:text-[#7eb3ff] sm:text-[13px] md:text-sm">
            {product.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-0.5 rounded-sm bg-green-700 px-1.5 py-0.5 text-[11px] font-bold text-white dark:bg-emerald-800">
            <Star className="h-3 w-3 fill-white text-white" />
            {product.rating}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>
        <CategoryAwarePrice product={product} variant="card" />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addCompare(product.id);
          }}
          className={cn(
            "mt-1 hidden w-full items-center justify-center gap-1.5 rounded-sm border py-2 text-xs font-semibold transition sm:flex",
            inCompare(product.id)
              ? "border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:border-emerald-600/50 dark:bg-emerald-950/60 dark:text-emerald-200"
              : "border-slate-200 bg-white text-slate-700 hover:border-[#2874f0]/40 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-[#5b9dff]/45"
          )}
          aria-pressed={inCompare(product.id)}
        >
          <Scale className="h-3.5 w-3.5" />
          {inCompare(product.id) ? t("compareAdded") : t("compare")}
        </button>
        <RippleButton
          ref={addBtnRef}
          disabled={!product.inStock}
          onClick={() => {
            flyToCart(addBtnRef.current, product.images[0]);
            addItem(product.id);
          }}
          rippleClassName="bg-white/30"
          className={cn(
            "w-full rounded-md py-2 text-xs font-bold tracking-wide shadow-sm transition sm:py-2.5 sm:text-sm",
            product.inStock
              ? "bg-[#2874f0] text-white hover:bg-[#1a65d8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb]"
              : "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          )}
        >
          {product.inStock ? t("buyNow") : t("outOfStock")}
        </RippleButton>
      </div>
    </article>
  );
}
