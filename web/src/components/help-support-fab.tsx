"use client";

import { Link } from "@/i18n/navigation";
import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

/** Left-side FAB so it does not overlap the WhatsApp widget on the right. */
export function HelpSupportFab() {
  const t = useTranslations("nav");

  return (
    <Link
      href="/help"
      className="fixed bottom-[4.75rem] left-4 z-[53] hidden h-12 w-12 items-center justify-center rounded-full bg-[#2874f0] text-white shadow-lg transition hover:scale-105 hover:shadow-xl md:bottom-8 md:left-8 md:flex md:h-14 md:w-14"
      aria-label={t("helpSupport")}
      title={t("helpSupport")}
    >
      <CircleHelp className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.2} />
    </Link>
  );
}
