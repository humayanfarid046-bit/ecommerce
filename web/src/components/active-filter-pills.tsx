"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  /** When set, `sub` pill shows this label (category sub-filter). */
  subLabel?: string | null;
};

export function ActiveFilterPills({ basePath, subLabel }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useTranslations("filters");

  const pills = useMemo(() => {
    const out: { key: string; label: string; removeKeys: string[] }[] = [];
    const min = sp.get("min");
    const max = sp.get("max");
    const rating = sp.get("rating");
    const discount = sp.get("discount");
    const stock = sp.get("stock");
    const sort = sp.get("sort");
    const sub = sp.get("sub");

    if (min)
      out.push({
        key: "min",
        label: t("pillMinPrice", { n: min }),
        removeKeys: ["min"],
      });
    if (max)
      out.push({
        key: "max",
        label: t("pillMaxPrice", { n: max }),
        removeKeys: ["max"],
      });
    if (rating)
      out.push({
        key: "rating",
        label: t("pillRating", { n: rating }),
        removeKeys: ["rating"],
      });
    if (discount)
      out.push({
        key: "discount",
        label: t("pillDiscount", { n: discount }),
        removeKeys: ["discount"],
      });
    if (stock === "1")
      out.push({
        key: "stock",
        label: t("pillInStock"),
        removeKeys: ["stock"],
      });
    if (sort === "price-asc" || sort === "price-desc")
      out.push({
        key: "sort",
        label:
          sort === "price-asc" ? t("sortPriceAsc") : t("sortPriceDesc"),
        removeKeys: ["sort"],
      });
    if (sub && subLabel)
      out.push({
        key: "sub",
        label: t("pillSub", { name: subLabel }),
        removeKeys: ["sub"],
      });
    else if (sub && !subLabel)
      out.push({
        key: "sub",
        label: t("pillSubSlug", { slug: sub }),
        removeKeys: ["sub"],
      });

    return out;
  }, [sp, subLabel, t]);

  if (pills.length === 0) return null;

  const remove = (removeKeys: string[]) => {
    const q = new URLSearchParams(sp.toString());
    for (const k of removeKeys) q.delete(k);
    const qs = q.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  return (
    <ul
      className="flex flex-wrap items-center gap-2"
      aria-label={t("activeFiltersAria")}
    >
      {pills.map((p) => (
        <li key={p.key}>
          <button
            type="button"
            onClick={() => remove(p.removeKeys)}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#0066ff]/25 bg-[#0066ff]/8 py-1 pl-3 pr-1 text-xs font-semibold text-slate-800",
              "transition hover:border-[#0066ff]/40 hover:bg-[#0066ff]/12 dark:border-[#0066ff]/35 dark:bg-[#0066ff]/15 dark:text-slate-100"
            )}
          >
            <span className="truncate">{p.label}</span>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-[#0066ff]/20"
              aria-hidden
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
