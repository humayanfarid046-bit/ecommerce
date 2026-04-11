"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heart, Scale, ShoppingCart, Star } from "lucide-react";
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

const BADGE_BLUR =
  "rounded-md border border-white/20 bg-black/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-md dark:bg-white/15 dark:backdrop-blur-md";

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
        "product-card-store group relative flex flex-col overflow-hidden rounded-xl",
        className
      )}
    >
      {/* Fixed 3:4 frame — image area height follows width */}
      <div className="product-card-image-well relative aspect-[3/4] w-full shrink-0 overflow-hidden">
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

          {showTopOffer ? (
            <div
              className={cn(
                BADGE_BLUR,
                "pointer-events-none absolute left-2 top-2 z-[5] max-w-[46%]"
              )}
            >
              {t("topOffer")}
            </div>
          ) : null}

          {product.discountPct > 0 ? (
            <span
              className={cn(
                BADGE_BLUR,
                "pointer-events-none absolute right-2 top-2 z-[5] text-right"
              )}
            >
              {product.discountPct}% {t("off")}
            </span>
          ) : null}
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
            "absolute bottom-2 right-2 z-20 rounded-full border border-white/25 bg-black/30 p-2 text-white shadow-md backdrop-blur-md transition-colors hover:bg-black/45 dark:border-white/20 dark:bg-white/15 dark:hover:bg-white/25",
            wish
              ? "text-rose-400"
              : "text-white/90 hover:text-rose-300"
          )}
          aria-label={t("wishlist")}
        >
          <Heart className={cn("h-4 w-4", wish && "fill-current")} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 border-t border-[#E5E7EB] p-2 text-left dark:border-slate-600/70 sm:gap-1.5 sm:p-3">
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

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <CategoryAwarePrice
            product={product}
            variant="card"
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addCompare(product.id);
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 transition dark:text-slate-300",
                inCompare(product.id)
                  ? "border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:border-emerald-600/50 dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "border-slate-200 bg-white/90 hover:border-[#2874f0]/45 dark:border-slate-600 dark:bg-slate-800/90 dark:hover:border-[#5b9dff]/45"
              )}
              aria-pressed={inCompare(product.id)}
              aria-label={inCompare(product.id) ? t("compareAdded") : t("compare")}
            >
              <Scale className="h-4 w-4" />
            </button>
            <button
              ref={addBtnRef}
              type="button"
              disabled={!product.inStock}
              onClick={() => {
                if (!product.inStock) return;
                flyToCart(addBtnRef.current, product.images[0]);
                addItem(product.id);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-[#2874f0] text-white shadow-[0_2px_12px_rgba(40,116,240,0.45)] ring-2 ring-[#2874f0]/25 transition hover:bg-[#1a65d8] hover:shadow-[0_4px_18px_rgba(40,116,240,0.55)] dark:bg-[#3b82f6] dark:ring-[#3b82f6]/30 dark:hover:bg-[#2563eb]",
                !product.inStock &&
                  "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none ring-0 dark:bg-slate-700 dark:text-slate-400"
              )}
              aria-label={
                product.inStock ? t("addToCart") : t("outOfStock")
              }
            >
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
