import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HelpContactSection } from "@/components/help-contact-section";
import { HelpIntro } from "@/components/help-intro";
import { ChevronDown } from "lucide-react";
import {
  innerPageShell,
  appHeading,
  appCard,
  sectionLabel,
  pressable,
} from "@/lib/app-inner-ui";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");

  const faqIds = ["cancel", "return", "wallet", "delivery", "account"] as const;

  return (
    <div className={cn(innerPageShell, "min-h-[65vh]")}>
      <header className="mb-2">
        <h1 className={cn(appHeading, "text-[1.65rem] font-bold tracking-tight md:text-3xl")}>
          {t("title")}
        </h1>
      </header>

      <HelpIntro />

      <section className="mb-10">
        <p className={sectionLabel}>{t("faqHeading")}</p>
        <div
          className={cn(
            "mt-4 space-y-2.5 p-4 sm:p-5",
            appCard,
            "border-slate-100/90 bg-white shadow-[0_2px_20px_rgba(15,23,42,0.06)] dark:border-white/[0.07] dark:bg-[#161d2b] dark:shadow-[0_12px_48px_rgba(0,0,0,0.42)]"
          )}
        >
          {faqIds.map((id) => (
            <details
              key={id}
              className={cn(
                "group overflow-hidden rounded-2xl border border-slate-100/80 bg-slate-50/50 open:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:open:bg-[#1a2230]",
                pressable
              )}
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3.5 text-[13px] font-semibold text-slate-900 [&::-webkit-details-marker]:hidden dark:text-[#e8edf5]">
                <span className="min-w-0 flex-1 leading-snug">{t(`faq.${id}.q`)}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180 dark:text-slate-500" />
              </summary>
              <p className="border-t border-slate-100/90 px-3.5 pb-3.5 pt-2.5 text-[12px] leading-relaxed text-slate-600 dark:border-white/[0.06] dark:text-slate-300/90">
                {t(`faq.${id}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      <HelpContactSection />

      <p className="mt-10">
        <Link
          href="/"
          className="inline-flex text-[13px] font-semibold text-[#0066ff] transition hover:underline dark:text-[#7cb4ff]"
        >
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
