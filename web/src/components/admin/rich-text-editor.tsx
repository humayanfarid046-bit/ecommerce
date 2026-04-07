"use client";

import { useCallback, useEffect, useRef } from "react";
import { Bold, Italic, Link2, List } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Bold / italic / bullets / link — no extra deps (React 19 friendly).
 */
export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value && el.innerHTML !== value) el.innerHTML = value;
    if (!value && !el.innerHTML && placeholder) {
      el.dataset.placeholder = placeholder;
    }
  }, [value, placeholder]);

  const sync = useCallback(() => {
    onChange(ref.current?.innerHTML ?? "");
  }, [onChange]);

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(cmd, false, arg);
      sync();
    },
    [sync]
  );

  const addLink = useCallback(() => {
    const url = window.prompt("URL", "https://");
    if (url) exec("createLink", url);
  }, [exec]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-950 ${className ?? ""}`}
    >
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={addLink}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          title="Link"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[180px] px-3 py-2 text-sm text-slate-800 outline-none dark:text-slate-100"
        data-placeholder={placeholder}
        onInput={sync}
        onBlur={sync}
      />
    </div>
  );
}
