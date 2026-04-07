import { ProfileInfoSection } from "@/components/settings/profile-info-section";
import { AccountAddressSection } from "@/components/account-address-section";
import { SecuritySection } from "@/components/settings/security-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { AppPreferencesSection } from "@/components/settings/app-preferences-section";
import { LegalSection } from "@/components/settings/legal-section";
import { ApiBackendSection } from "@/components/settings/api-backend-section";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-2xl">
          {t("settingsTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("settingsSubtitle")}
        </p>
      </div>

      <ProfileInfoSection />
      <AccountAddressSection />
      <SecuritySection />
      <NotificationsSection />
      <AppPreferencesSection />
      <ApiBackendSection />
      <LegalSection />
    </div>
  );
}
