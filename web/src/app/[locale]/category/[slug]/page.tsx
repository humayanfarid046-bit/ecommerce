import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { notFound } from "next/navigation";
import { categories } from "@/lib/mock-data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { absoluteUrl, getSiteUrl } from "@/lib/sitemap-build";
import { routing } from "@/i18n/routing";
import { CategoryListingClient } from "@/components/category-listing-client";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    sub?: string;
    min?: string;
    max?: string;
    rating?: string;
    discount?: string;
    stock?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Not found" };
  const tc = await getTranslations({
    locale: locale as Locale,
    namespace: "categories",
  });
  const tpc = await getTranslations({
    locale: locale as Locale,
    namespace: "categoryPage",
  });
  const name = tc(slug);
  const base = getSiteUrl();
  const path = `/category/${slug}`;
  const canonical = absoluteUrl(base, locale, path);
  const title = `${name} | Libas Collection`;
  const description = tpc("metaDescription", { name });
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          absoluteUrl(base, loc, path),
        ]) as [string, string][]
      ),
    },
    openGraph: { title, description, url: canonical, type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      }
    >
      <CategoryListingClient slug={slug} icon={cat.icon} sp={sp} />
    </Suspense>
  );
}
