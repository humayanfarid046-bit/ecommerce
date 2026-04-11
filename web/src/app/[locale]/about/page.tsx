import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  appCard,
  appHeading,
  appSubhead,
  innerPageShellWide,
} from "@/lib/app-inner-ui";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className={innerPageShellWide}>
      <article className={`${appCard} p-6 sm:p-8`}>
        <h1 className={`${appHeading} text-xl font-semibold sm:text-2xl`}>
          {t("title")}
        </h1>
        <p className={`${appSubhead} mt-4 max-w-2xl whitespace-pre-line`}>
          {t("body")}
        </p>
        <p className="mt-8">
          <Link
            href="/help#contact"
            className="text-sm font-bold text-[#0066ff] transition hover:underline dark:text-[#60a5fa]"
          >
            {t("contactCta")}
          </Link>
        </p>
      </article>
    </div>
  );
}
