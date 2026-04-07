"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "@/context/wishlist-context";
import { setSnapshot } from "@/lib/wishlist-price-snapshot";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = { productId: string; price: number };

export function ProductWishlistToggle({ productId, price }: Props) {
  const { toggle, has } = useWishlist();
  const on = has(productId);
  const t = useTranslations("productCard");

  return (
    <button
      type="button"
      onClick={() => {
        if (!on) setSnapshot(productId, price);
        toggle(productId);
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
        on
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
      )}
      aria-pressed={on}
    >
      <motion.span
        key={on ? "on" : "off"}
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
      >
        <Heart className={cn("h-4 w-4", on && "fill-current")} />
      </motion.span>
      {t("wishlist")}
    </button>
  );
}
