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

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tAccount = await getTranslations("account");

  return (
    <div className={innerPageShellWide}>
      <article className={`${appCard} p-6 sm:p-8`}>
        <h1 className={`${appHeading} text-xl font-semibold sm:text-2xl`}>
          {t("cookiesTitle")}
        </h1>
        <div className={`mt-6 ${legalProse}`}>
          <p>{t("cookiesIntro")}</p>
          <h2 className={appTextTitle}>{t("cookiesEssential")}</h2>
          <p>{t("cookiesEssentialBody")}</p>
          <h2 className={appTextTitle}>{t("cookiesAnalytics")}</h2>
          <p>{t("cookiesAnalyticsBody")}</p>
        </div>
      </article>
      <LegalHelpCta />
      <LegalCrossLinks exclude="cookies" />
      <Link
        href="/account/settings"
        className="mt-8 inline-block text-sm font-bold text-[#0066ff] transition hover:underline dark:text-[#60a5fa]"
      >
        ← {tAccount("settingsTitle")}
      </Link>
    </div>
  );
}
