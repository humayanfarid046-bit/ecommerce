"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { AppPreferencesSection } from "@/components/settings/app-preferences-section";
import { useTranslations } from "next-intl";

export default function AccountSettingsPreferencesPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <AccountSectionHeader
        title={t("appPreferencesTitle")}
        subtitle={t("appPreferencesSubtitle")}
        backHref="/account/settings"
      />
      <AppPreferencesSection />
    </div>
  );
}
