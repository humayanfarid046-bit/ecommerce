import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const linkClass =
  "text-sm font-bold text-[#0066ff] hover:underline dark:text-[#60a5fa]";

type Props = { exclude?: "privacy" | "terms" | "shipping" | "cookies" };

export async function LegalCrossLinks({ exclude }: Props) {
  const t = await getTranslations("legal");

  const items: { href: string; key: Props["exclude"]; label: string }[] = [
    { href: "/privacy", key: "privacy", label: t("legalIndexPrivacy") },
    { href: "/terms", key: "terms", label: t("legalIndexTerms") },
    { href: "/shipping", key: "shipping", label: t("legalIndexShipping") },
    { href: "/cookies", key: "cookies", label: t("legalIndexCookies") },
  ];

  return (
    <nav
      className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-8 dark:border-slate-700"
      aria-label="Legal"
    >
      {items
        .filter((i) => i.key !== exclude)
        .map((i) => (
          <Link key={i.href} href={i.href} className={linkClass}>
            {i.label}
          </Link>
        ))}
    </nav>
  );
}
