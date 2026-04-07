import { getFrequentlyBoughtTogether } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";
import { getTranslations } from "next-intl/server";
import { PRODUCT_GRID } from "@/lib/store-layout";

type Props = { productId: string };

export async function FrequentlyBoughtTogether({ productId }: Props) {
  const list = getFrequentlyBoughtTogether(productId, 3);
  if (!list.length) return null;

  const t = await getTranslations("product.trust");

  return (
    <section className="mt-14 md:mt-20">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t("fbtTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("fbtSubtitle")}
      </p>
      <div className={`mt-6 ${PRODUCT_GRID}`}>
        {list.map((p) => (
          <ProductCard key={p.id} product={p} showTopOffer={false} />
        ))}
      </div>
    </section>
  );
}
