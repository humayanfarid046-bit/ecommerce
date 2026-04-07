import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { absoluteUrl, getSiteUrl } from "@/lib/sitemap-build";
import { routing } from "@/i18n/routing";
import { ProductPageView } from "@/components/product-page-view";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const base = getSiteUrl();
  const path = `/product/${id}`;
  const canonical = absoluteUrl(base, locale, path);
  const title = "Product | Libas Collection";
  return {
    title,
    description: "Shop on Libas Collection.",
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          absoluteUrl(base, loc, path),
        ]) as [string, string][]
      ),
    },
    openGraph: { type: "website", url: canonical, title },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ProductPageView id={id} locale={locale} />;
}
