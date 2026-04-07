import { PRODUCT_GRID_COLS, STORE_SHELL } from "@/lib/store-layout";

export default function LocaleLoading() {
  return (
    <div className={`${STORE_SHELL} animate-pulse py-8 md:py-12`}>
      <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 md:h-64" />
      <div className={`mt-12 ${PRODUCT_GRID_COLS}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-3xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className={`mt-12 ${PRODUCT_GRID_COLS}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-3xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
