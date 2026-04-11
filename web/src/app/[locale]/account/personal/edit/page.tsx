"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { ProfileInfoSection } from "@/components/settings/profile-info-section";
import { useTranslations } from "next-intl";

export default function AccountPersonalEditPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <AccountSectionHeader
        title={t("editProfileTitle")}
        backHref="/account/personal"
      />
      <ProfileInfoSection />
    </div>
  );
}
