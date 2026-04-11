import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { appCardSubtle, appSubhead, sectionLabel } from "@/lib/app-inner-ui";

export async function LegalHelpCta() {
  const t = await getTranslations("legal");
  const tHelp = await getTranslations("help");

  return (
    <section
      className={`${appCardSubtle} mt-8 border-[#0066ff]/20 bg-[#0066ff]/[0.06] p-5 dark:border-[#0066ff]/25 dark:bg-[#0066ff]/12`}
    >
      <h2 className={sectionLabel}>{t("legalMoreHelp")}</h2>
      <p className={`${appSubhead} mt-2`}>{t("legalMoreHelpBody")}</p>
      <Link
        href="/help"
        className="mt-4 inline-block text-sm font-bold text-[#0066ff] transition hover:underline dark:text-[#60a5fa]"
      >
        {tHelp("title")} →
      </Link>
    </section>
  );
}
