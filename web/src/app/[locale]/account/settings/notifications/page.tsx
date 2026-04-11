"use client";

import { AccountSectionHeader } from "@/components/account-section-header";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { useTranslations } from "next-intl";

export default function AccountSettingsNotificationsPage() {
  const t = useTranslations("account");

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <AccountSectionHeader
        title={t("notificationsTitle")}
        subtitle={t("notificationsSubtitle")}
        backHref="/account/settings"
      />
      <NotificationsSection />
    </div>
  );
}
