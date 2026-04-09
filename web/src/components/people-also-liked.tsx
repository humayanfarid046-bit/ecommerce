import { getPeopleAlsoLiked } from "@/lib/storefront-catalog";
import { ProductCard } from "@/components/product-card";
import { getTranslations } from "next-intl/server";
import { PRODUCT_GRID } from "@/lib/store-layout";

type Props = { productId: string };

export async function PeopleAlsoLiked({ productId }: Props) {
  const list = getPeopleAlsoLiked(productId, 4);
  if (!list.length) return null;

  const t = await getTranslations("product.trust");

  return (
    <section className="mt-14 border-t border-slate-200/80 pt-14 dark:border-slate-800 md:mt-20 md:pt-20">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t("alsoLikedTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("alsoLikedSubtitle")}
      </p>
      <div className={`mt-6 ${PRODUCT_GRID}`}>
        {list.map((p) => (
          <ProductCard key={p.id} product={p} showTopOffer={false} />
        ))}
      </div>
    </section>
  );
}
