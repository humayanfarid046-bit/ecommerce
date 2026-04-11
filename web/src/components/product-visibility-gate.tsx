"use client";

import { useEffect, useState } from "react";
import { getProductMeta } from "@/lib/product-admin-meta";
import { useTranslations } from "next-intl";

export function ProductVisibilityGate({
  productId,
  children,
}: {
  productId: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("product");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const load = () => {
      const m = getProductMeta(productId);
      setHidden(m.visible === false);
    };
    load();
    window.addEventListener("lc-product-meta", load);
    return () => window.removeEventListener("lc-product-meta", load);
  }, [productId]);

  if (hidden) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg font-semibold text-text-primary dark:text-slate-100">
          {t("hiddenByMerchant")}
        </p>
        <p className="mt-2 text-sm font-medium text-text-secondary">{t("hiddenByMerchantHint")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
