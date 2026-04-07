"use client";

type Props = {
  title: string;
  url: string;
  description: string;
};

export function GoogleSnippetPreview({ title, url, description }: Props) {
  return (
    <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="line-clamp-2 text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
        {title || "Page title"}
      </p>
      <p className="mt-1 truncate text-xs text-[#006621] dark:text-emerald-400">
        {url || "https://example.com/page"}
      </p>
      <p className="mt-1 line-clamp-3 text-sm text-[#4d5156] dark:text-slate-400">
        {description || "Meta description appears here."}
      </p>
    </div>
  );
}
