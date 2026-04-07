"use client";

import { useEffect, useState } from "react";
import { getProductMeta } from "@/lib/product-admin-meta";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";

type Props = {
  productId: string;
  basePrice: number;
};

export function FlashSaleBanner({ productId, basePrice }: Props) {
  const t = useTranslations("product");
  const [end, setEnd] = useState<string | null>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const load = () => {
      const m = getProductMeta(productId);
      if (m.flashSale?.endsAt) {
        setEnd(m.flashSale.endsAt);
        setPct(m.flashSale.discountPct);
      } else {
        setEnd(null);
        setPct(0);
      }
    };
    load();
    window.addEventListener("lc-product-meta", load);
    return () => window.removeEventListener("lc-product-meta", load);
  }, [productId]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!end || !pct) return null;
  const endMs = new Date(end).getTime();
  if (endMs <= now) return null;

  const left = Math.max(0, endMs - now);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const salePrice = Math.round(basePrice * (1 - pct / 100));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-rose-300/80 bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 text-sm dark:border-rose-900/60 dark:from-rose-950/40 dark:to-amber-950/30">
      <Zap className="h-5 w-5 shrink-0 text-rose-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-rose-900 dark:text-rose-100">
          {t("flashSaleTitle", { pct })}
        </p>
        <p className="mt-0.5 text-xs text-rose-800/90 dark:text-rose-200/90">
          {t("flashSaleEndsIn", {
            h: String(h).padStart(2, "0"),
            m: String(m).padStart(2, "0"),
            s: String(s).padStart(2, "0"),
          })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">
          {t("flashSalePrice")}
        </p>
        <p className="text-lg font-extrabold text-rose-900 dark:text-rose-50">
          ₹{salePrice.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}
