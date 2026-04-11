"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { SecuritySection } from "@/components/settings/security-section";
import { useTranslations } from "next-intl";

export default function AccountSettingsSecurityPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <AccountSectionHeader
        title={t("securityTitle")}
        subtitle={t("securitySubtitle")}
        backHref="/account/settings"
      />
      <SecuritySection />
    </div>
  );
}
