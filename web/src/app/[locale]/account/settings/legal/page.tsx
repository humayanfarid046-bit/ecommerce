"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { LegalSection } from "@/components/settings/legal-section";
import { useTranslations } from "next-intl";

export default function AccountSettingsLegalPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <AccountSectionHeader
        title={t("legalTitle")}
        subtitle={t("legalSubtitle")}
        backHref="/account/settings"
      />
      <LegalSection />
    </div>
  );
}
