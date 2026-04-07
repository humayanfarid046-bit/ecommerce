import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forgotPassword");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className="glass glass-premium w-full rounded-3xl p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
          {t("subtitle")}
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block text-sm font-bold text-[#0066ff] transition hover:text-[#0052cc] hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
