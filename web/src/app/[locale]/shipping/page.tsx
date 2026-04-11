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

export default async function ShippingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tAccount = await getTranslations("account");

  return (
    <div className={innerPageShellWide}>
      <article className={`${appCard} p-6 sm:p-8`}>
        <h1 className={`${appHeading} text-xl font-semibold sm:text-2xl`}>
          {t("shippingTitle")}
        </h1>
        <div className={`mt-6 ${legalProse}`}>
          <p>{t("shippingIntro")}</p>
          <h2 className={appTextTitle}>{t("shippingDispatch")}</h2>
          <p>{t("shippingDispatchBody")}</p>
          <h2 className={appTextTitle}>{t("shippingReturns")}</h2>
          <p>{t("shippingReturnsBody")}</p>
          <h2 className={appTextTitle}>{t("shippingCod")}</h2>
          <p>{t("shippingCodBody")}</p>
        </div>
      </article>
      <LegalHelpCta />
      <LegalCrossLinks exclude="shipping" />
      <Link
        href="/account/settings"
        className="mt-8 inline-block text-sm font-bold text-[#0066ff] transition hover:underline dark:text-[#60a5fa]"
      >
        ← {tAccount("settingsTitle")}
      </Link>
    </div>
  );
}
