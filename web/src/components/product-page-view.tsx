"use client";

import { useEffect, useState, Suspense } from "react";
import { getProductById, type Product } from "@/lib/storefront-catalog";
import { ProductGallery } from "@/components/product-gallery";
import { ProductActions } from "@/components/product-actions";
import { Star } from "lucide-react";
import { ProductReviewsSection } from "@/components/product-reviews-section";
import { useTranslations } from "next-intl";
import { RecordProductView } from "@/components/record-product-view";
import { ProductTrustStrip } from "@/components/product-trust-strip";
import { RatingBreakdownChart } from "@/components/rating-breakdown-chart";
import { DeliveryEstimator } from "@/components/delivery-estimator";
import { OpenBoxBanner } from "@/components/open-box-banner";
import { FrequentlyBoughtTogether } from "@/components/frequently-bought-together";
import { PeopleAlsoLiked } from "@/components/people-also-liked";
import { SocialProofToast } from "@/components/social-proof-toast";
import { getRatingBreakdown } from "@/lib/product-trust";
import { ProductVisibilityGate } from "@/components/product-visibility-gate";
import { ProductPagePricing } from "@/components/product-page-pricing";
import { ProductVariantSwatches } from "@/components/product-variant-swatches";
import { ProductStickyAddToCart } from "@/components/product-sticky-add-to-cart";
import { ProductShareRow } from "@/components/product-share-row";
import { STORE_SHELL } from "@/lib/store-layout";
import { absoluteUrl, getSiteUrl } from "@/lib/sitemap-build";
import { Link } from "@/i18n/navigation";
import {
  CATALOG_EVENT,
  fetchRemoteCatalogSnapshot,
  setRemoteCatalogSnapshot,
} from "@/lib/catalog-products-storage";

function truncateMeta(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function ProductJsonLd({ product, pageUrl }: { product: Product; pageUrl: string }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: truncateMeta(product.description, 5000),
    brand: { "@type": "Brand", name: product.brand },
    sku: product.id,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export function ProductPageView({ id, locale }: { id: string; locale: string }) {
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const t = useTranslations("product");
  const tc = useTranslations("cart");

  useEffect(() => {
    let cancelled = false;

    const apply = () => {
      setProduct(getProductById(id) ?? null);
    };

    window.addEventListener(CATALOG_EVENT, apply);

    void (async () => {
      setProduct(undefined);
      try {
        const remote = await fetchRemoteCatalogSnapshot();
        if (cancelled) return;
        setRemoteCatalogSnapshot(remote);
        if (cancelled) return;
        apply();
      } catch {
        if (!cancelled) apply();
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(CATALOG_EVENT, apply);
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const base = getSiteUrl();
    const path = `/product/${id}`;
    const canonical = absoluteUrl(base, locale, path);
    const title = `${product.title} | Libas Collection`;
    document.title = title;
    const desc = truncateMeta(
      product.description || product.highlights.join(" · ") || product.title,
      155
    );
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }, [product, id, locale]);

  if (product === undefined) {
    return (
      <div className={`${STORE_SHELL} py-16`}>
        <div className="h-10 w-3/4 max-w-md animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4">
            <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className={`${STORE_SHELL} py-16 text-center`}>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t("notFoundTitle")}
        </p>
        <p className="mt-2 text-sm text-neutral-500">{t("notFoundHint")}</p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-xl bg-[#0066ff] px-6 py-2 text-sm font-bold text-white"
        >
          {tc("continueShopping")}
        </Link>
      </div>
    );
  }

  const breakdown = getRatingBreakdown(product);
  const showOpenBox =
    product.openBoxDelivery === true || product.price >= 5000;
  const pageUrl = absoluteUrl(getSiteUrl(), locale, `/product/${id}`);

  return (
    <ProductVisibilityGate productId={id}>
      <ProductJsonLd product={product} pageUrl={pageUrl} />
      <div
        className={`${STORE_SHELL} min-h-[calc(100dvh-5rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:py-8 md:py-10 max-lg:pb-36`}
      >
        <SocialProofToast productTitle={product.title} />
        <RecordProductView productId={product.id} />
        <div className="grid min-h-0 gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-14 lg:min-h-[min(880px,calc(100dvh-8rem))]">
          <div className="min-h-0 min-w-0 lg:max-h-[min(880px,calc(100dvh-8rem))] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <ProductGallery
              images={product.images.length ? product.images : ["/vercel.svg"]}
              title={product.title}
              videoUrl={product.demoVideoUrl}
              galleryBackground={product.galleryBackground}
            />
          </div>
          <div className="min-h-0 min-w-0 lg:max-h-[min(880px,calc(100dvh-8rem))] lg:overflow-y-auto lg:overscroll-contain lg:pl-1">
            <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
              {product.brand}
            </p>
            <h1 className="mb-5 text-2xl font-bold leading-tight tracking-tight text-[#1F2937] dark:text-slate-100">
              {product.title}
            </h1>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                {product.rating}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {t("ratingsReviews", { count: product.reviewCount })}
              </span>
            </div>

            <ProductPagePricing product={product} />
            <ProductVariantSwatches
              sizes={product.sizeOptions}
              colors={product.colorOptions}
            />
            <p className="mb-5 text-sm text-neutral-600 dark:text-neutral-300">
              {product.inStock ? (
                <span className="text-emerald-700 dark:text-emerald-400">
                  {t("inStock")}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">
                  {t("outOfStock")}
                </span>
              )}
            </p>
            <div className="mb-5">
              <ProductTrustStrip product={product} />
            </div>
            <ProductActions productId={product.id} inStock={product.inStock} />
            <ProductShareRow productTitle={product.title} />

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(200px,280px)] lg:items-start">
              <RatingBreakdownChart
                breakdown={breakdown}
                reviewCount={product.reviewCount}
              />
              <DeliveryEstimator />
            </div>

            {showOpenBox ? (
              <div className="mt-6">
                <OpenBoxBanner />
              </div>
            ) : null}
            {product.specifications && product.specifications.length > 0 ? (
              <div className="mt-8 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-[#1F2937] dark:text-slate-100">
                  {t("specifications")}
                </h2>
                <table className="mt-3 w-full border-collapse text-sm">
                  <tbody>
                    {product.specifications.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-[#E5E7EB] last:border-0 dark:border-slate-700"
                      >
                        <th
                          scope="row"
                          className="w-[40%] py-2.5 pr-4 text-left font-medium text-neutral-600 dark:text-neutral-400"
                        >
                          {row.label}
                        </th>
                        <td className="py-2.5 text-neutral-900 dark:text-neutral-200">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div
              className={
                product.specifications?.length
                  ? "mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] dark:border-slate-700 dark:bg-slate-900"
                  : "mt-8 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] dark:border-slate-700 dark:bg-slate-900"
              }
            >
              <h2 className="text-base font-semibold text-[#1F2937] dark:text-slate-100">
                {t("highlights")}
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {product.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="mt-14 h-48 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
          }
        >
          <FrequentlyBoughtTogether productId={product.id} />
        </Suspense>

        <Suspense
          fallback={
            <div className="mt-14 h-48 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
          }
        >
          <PeopleAlsoLiked productId={product.id} />
        </Suspense>

        <ProductReviewsSection product={product} />
        <ProductStickyAddToCart productId={product.id} inStock={product.inStock} />
      </div>
    </ProductVisibilityGate>
  );
}
