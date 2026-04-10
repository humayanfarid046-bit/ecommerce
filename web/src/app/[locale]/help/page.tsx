import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, MessageCircle } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");

  const faqIds = ["cancel", "return", "wallet", "delivery", "account"] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {t("intro")}
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("faqHeading")}
        </h2>
        <div className="mt-4 space-y-2">
          {faqIds.map((id) => (
            <details
              key={id}
              className="group rounded-2xl border border-slate-200/90 bg-white/80 open:shadow-md dark:border-slate-700/80 dark:bg-slate-900/40"
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                {t(`faq.${id}.q`)}
              </summary>
              <p className="border-t border-slate-100 px-4 pb-3 pt-2 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {t(`faq.${id}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 mt-12 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/[0.06] p-6 dark:border-[#0066ff]/30 dark:bg-[#0066ff]/10"
      >
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          {t("contactHeading")}
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="tel:+910000000000"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
          >
            <Phone className="h-4 w-4 text-[#0066ff]" />
            {t("callUs")}
          </a>
          <a
            href="mailto:support@example.com"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
          >
            <Mail className="h-4 w-4 text-[#0066ff]" />
            {t("emailUs")}
          </a>
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            {t("whatsapp")}
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
          {t("contactDemo")}
        </p>
      </section>

      <p className="mt-8 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-[#0066ff] hover:underline"
        >
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
