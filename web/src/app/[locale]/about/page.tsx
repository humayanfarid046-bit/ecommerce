import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { STORE_SHELL } from "@/lib/store-layout";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className={`${STORE_SHELL} py-8 md:py-12`}>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {t("body")}
      </p>
      <p className="mt-8">
        <Link
          href="/help#contact"
          className="text-sm font-bold text-[#0066ff] hover:underline"
        >
          {t("contactCta")}
        </Link>
      </p>
    </div>
  );
}
