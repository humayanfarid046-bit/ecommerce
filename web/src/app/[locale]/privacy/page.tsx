import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalCrossLinks } from "@/components/legal-cross-links";
import { LegalHelpCta } from "@/components/legal-help-cta";
import {
  appCard,
  appHeading,
  appTextTitle,
  innerPageShellWide,
  legalProse,
} from "@/lib/app-inner-ui";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tAccount = await getTranslations("account");

  return (
    <div className={innerPageShellWide}>
      <article className={`${appCard} p-6 sm:p-8`}>
        <h1 className={`${appHeading} text-xl font-semibold sm:text-2xl`}>
          {t("privacyTitle")}
        </h1>
        <div className={`mt-6 ${legalProse}`}>
          <p>{t("privacyIntro")}</p>
          <p>{t("privacyDemo")}</p>
          <h2 className={appTextTitle}>{t("privacyBusiness")}</h2>
          <p>{t("privacyBusinessBody")}</p>
          <h2 className={appTextTitle}>{t("privacyData")}</h2>
          <p>{t("privacyDataBody")}</p>
          <h2 className={appTextTitle}>{t("privacyUse")}</h2>
          <p>{t("privacyUseBody")}</p>
          <h2 className={appTextTitle}>{t("privacyPayments")}</h2>
          <p>{t("privacyPaymentsBody")}</p>
          <h2 className={appTextTitle}>{t("privacySecurity")}</h2>
          <p>{t("privacySecurityBody")}</p>
          <h2 className={appTextTitle}>{t("privacyRetention")}</h2>
          <p>{t("privacyRetentionBody")}</p>
          <h2 className={appTextTitle}>{t("privacyRights")}</h2>
          <p>{t("privacyRightsBody")}</p>
          <h2 className={appTextTitle}>{t("privacyGrievance")}</h2>
          <p>{t("privacyGrievanceBody")}</p>
        </div>
      </article>
      <LegalHelpCta />
      <LegalCrossLinks exclude="privacy" />
      <Link
        href="/account/settings"
        className="mt-8 inline-block text-sm font-bold text-[#0066ff] transition hover:underline dark:text-[#60a5fa]"
      >
        ← {tAccount("settingsTitle")}
      </Link>
    </div>
  );
}
