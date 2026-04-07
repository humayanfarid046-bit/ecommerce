"use client";

import type { Product } from "@/lib/mock-data";
import { CategoryAwarePrice, useEffectiveUnitPrice } from "@/components/category-aware-price";
import { FlashSaleBanner } from "@/components/flash-sale-banner";

type Props = { product: Product };

export function ProductPagePricing({ product }: Props) {
  const effective = useEffectiveUnitPrice(product);

  return (
    <>
      <CategoryAwarePrice product={product} variant="pdp" />
      <div className="mb-5">
        <FlashSaleBanner productId={product.id} basePrice={effective} />
      </div>
    </>
  );
}
