"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { ProfilePersonalMenu } from "@/components/settings/profile-personal-menu";
import { useTranslations } from "next-intl";

export default function AccountPersonalPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6">
      <AccountSectionHeader title={t("personalInfo")} backHref="/account" />
      <ProfilePersonalMenu />
    </div>
  );
}
