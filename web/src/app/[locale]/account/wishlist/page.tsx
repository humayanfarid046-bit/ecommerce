"use client";

import { useTranslations } from "next-intl";
import { WishlistContent } from "@/components/wishlist-content";
import { AccountSectionHeader } from "@/components/account-section-header";

export default function AccountWishlistPage() {
  const t = useTranslations("wishlist");
  const ta = useTranslations("account");

  return (
    <div className="min-w-0">
      <AccountSectionHeader
        title={t("title")}
        subtitle={ta("wishlistAccountHint")}
      />
      <WishlistContent embedded />
    </div>
  );
}
