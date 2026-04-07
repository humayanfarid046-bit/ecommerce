import { STORE_SHELL } from "@/lib/store-layout";

export function ProductPageSkeleton() {
  return (
    <div className={`${STORE_SHELL} animate-pulse py-8 md:py-12`}>
      <div className="grid min-h-0 gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-14 lg:min-h-[min(880px,calc(100dvh-8rem))]">
        <div className="min-h-0 lg:max-h-[min(880px,calc(100dvh-8rem))] lg:overflow-hidden">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-16 rounded-xl bg-slate-200 dark:bg-slate-700"
                />
              ))}
            </div>
            <div className="aspect-square min-h-[280px] flex-1 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="min-h-0 space-y-4 lg:max-h-[min(880px,calc(100dvh-8rem))] lg:overflow-hidden">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-9 w-4/5 max-w-md rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-12 w-full max-w-sm rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
