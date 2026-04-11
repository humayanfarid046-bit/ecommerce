"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { AccountAddressSection } from "@/components/account-address-section";
import { useTranslations } from "next-intl";

export default function AccountSettingsAddressesPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <AccountSectionHeader
        title={t("addressBook")}
        subtitle={t("addressBookHint")}
        backHref="/account/settings"
      />
      <AccountAddressSection />
    </div>
  );
}
