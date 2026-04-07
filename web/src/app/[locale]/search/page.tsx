import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { SearchListingClient } from "@/components/search-listing-client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    min?: string;
    max?: string;
    rating?: string;
    discount?: string;
    stock?: string;
    visual?: string;
    sort?: string;
  }>;
};

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;

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
      <SearchListingClient sp={sp} />
    </Suspense>
  );
}
