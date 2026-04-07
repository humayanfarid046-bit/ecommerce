"use client";

import { useTranslations } from "next-intl";
import { WishlistContent } from "@/components/wishlist-content";

export default function AccountWishlistPage() {
  const t = useTranslations("wishlist");
  const ta = useTranslations("account");

  return (
    <div>
      <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{ta("wishlistAccountHint")}</p>
      <WishlistContent embedded />
    </div>
  );
}
