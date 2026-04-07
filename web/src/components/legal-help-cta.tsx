import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function LegalHelpCta() {
  const t = await getTranslations("legal");
  const tHelp = await getTranslations("help");

  return (
    <section className="mt-10 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/[0.06] p-5 dark:border-[#0066ff]/30 dark:bg-[#0066ff]/10">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        {t("legalMoreHelp")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {t("legalMoreHelpBody")}
      </p>
      <Link
        href="/help"
        className="mt-4 inline-block text-sm font-bold text-[#0066ff] hover:underline dark:text-[#60a5fa]"
      >
        {tHelp("title")} →
      </Link>
    </section>
  );
}
