import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalCrossLinks } from "@/components/legal-cross-links";
import { LegalHelpCta } from "@/components/legal-help-cta";

type Props = { params: Promise<{ locale: string }> };

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tAccount = await getTranslations("account");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        {t("cookiesTitle")}
      </h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p>{t("cookiesIntro")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("cookiesEssential")}
        </h2>
        <p>{t("cookiesEssentialBody")}</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t("cookiesAnalytics")}
        </h2>
        <p>{t("cookiesAnalyticsBody")}</p>
      </div>
      <LegalHelpCta />
      <LegalCrossLinks exclude="cookies" />
      <Link
        href="/account/settings"
        className="mt-8 inline-block text-sm font-bold text-[#0066ff] hover:underline"
      >
        ← {tAccount("settingsTitle")}
      </Link>
    </div>
  );
}
