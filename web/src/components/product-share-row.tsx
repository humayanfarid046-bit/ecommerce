"use client";

import { useTranslations } from "next-intl";
import { ShareButton } from "@/components/share-button";

type Props = { productTitle: string };

export function ProductShareRow({ productTitle }: Props) {
  const t = useTranslations("share");
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-neutral-200/80 pb-6 dark:border-slate-700/80">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secondary dark:text-neutral-400">
        {t("shareThisProduct")}
      </span>
      <ShareButton
        title={productTitle}
        text={t("shareProductText", { title: productTitle })}
      />
    </div>
  );
}
