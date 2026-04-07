import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalCrossLinks } from "@/components/legal-cross-links";
import { LegalHelpCta } from "@/components/legal-help-cta";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tAccount = await getTranslations("account");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        {t("privacyTitle")}
      </h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p>{t("privacyIntro")}</p>
        <p>{t("privacyDemo")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyBusiness")}
        </h2>
        <p>{t("privacyBusinessBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyData")}
        </h2>
        <p>{t("privacyDataBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyUse")}
        </h2>
        <p>{t("privacyUseBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyPayments")}
        </h2>
        <p>{t("privacyPaymentsBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacySecurity")}
        </h2>
        <p>{t("privacySecurityBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyRetention")}
        </h2>
        <p>{t("privacyRetentionBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyRights")}
        </h2>
        <p>{t("privacyRightsBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("privacyGrievance")}
        </h2>
        <p>{t("privacyGrievanceBody")}</p>
      </div>
      <LegalHelpCta />
      <LegalCrossLinks exclude="privacy" />
      <Link
        href="/account/settings"
        className="mt-8 inline-block text-sm font-bold text-[#0066ff] hover:underline"
      >
        ← {tAccount("settingsTitle")}
      </Link>
    </div>
  );
}
