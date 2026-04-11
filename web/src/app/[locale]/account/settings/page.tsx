"use client";

import { AccountNavTiles } from "@/components/account-nav-tiles";
import { AccountSectionHeader } from "@/components/account-section-header";
import { useTranslations } from "next-intl";
import {
  User,
  MapPin,
  Shield,
  Bell,
  SlidersHorizontal,
  Scale,
} from "lucide-react";

export default function AccountSettingsHubPage() {
  const t = useTranslations("account");

  const items = [
    { href: "/account/personal", label: t("personalInfo"), icon: User },
    { href: "/account/settings/addresses", label: t("addressBook"), icon: MapPin },
    { href: "/account/settings/security", label: t("securityTitle"), icon: Shield },
    {
      href: "/account/settings/notifications",
      label: t("notificationsTitle"),
      icon: Bell,
    },
    {
      href: "/account/settings/preferences",
      label: t("appPreferencesTitle"),
      icon: SlidersHorizontal,
    },
    { href: "/account/settings/legal", label: t("legalTitle"), icon: Scale },
  ];

  return (
    <div className="min-w-0">
      <AccountSectionHeader
        title={t("settingsTitle")}
        subtitle={t("settingsHubSubtitle")}
        backHref="/account"
      />
      <AccountNavTiles items={items} className="mt-2" />
    </div>
  );
}
