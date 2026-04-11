import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { appCard, appHeading, appSubhead, innerPageShell } from "@/lib/app-inner-ui";

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forgotPassword");

  return (
    <div
      className={`${innerPageShell} mx-auto flex flex-col items-center text-center`}
    >
      <div className={`${appCard} w-full p-8 sm:p-10`}>
        <h1 className={`${appHeading} text-xl font-semibold sm:text-2xl`}>
          {t("title")}
        </h1>
        <p className={`${appSubhead} mt-3 font-medium`}>{t("subtitle")}</p>
        <Link
          href="/login"
          className="mt-8 inline-block text-sm font-bold text-[#0066ff] transition hover:text-[#0052cc] hover:underline dark:text-[#60a5fa]"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
