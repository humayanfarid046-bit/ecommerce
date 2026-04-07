"use client";

import { useRouter } from "@/i18n/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { Camera, Mic, Search } from "lucide-react";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import {
  extractAverageRgb,
  rankProductsByImageColor,
} from "@/lib/visual-search";
import { getProducts } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

type SearchBarProps = {
  /** Flipkart-style white bar on blue header */
  variant?: "default" | "flipkart";
};

export function SearchBar({ variant = "default" }: SearchBarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("search");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [visualBusy, setVisualBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const products = useCatalogProducts();

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 6);
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s)
    ).slice(0, 8);
  }, [q, products]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit() {
    const s = q.trim();
    if (!s) return;
    router.push(`/search?q=${encodeURIComponent(s)}`);
    setOpen(false);
  }

  function startVoiceSearch() {
    if (typeof window === "undefined") return;
    const W = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((ev: Event) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((ev: Event) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) {
      window.alert(t("voiceNotSupported"));
      return;
    }
    const rec = new SR();
    rec.lang = locale === "bn" ? "bn-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: Event) => {
      const r = ev as unknown as { results: { 0: { 0: { transcript: string } } } };
      const text = r.results[0]?.[0]?.transcript?.trim();
      if (text) {
        setQ(text);
        router.push(`/search?q=${encodeURIComponent(text)}`);
        setOpen(false);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  async function onVisualPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    setVisualBusy(true);
    setOpen(false);
    try {
      const rgb = await extractAverageRgb(f);
      const pool = products.length ? products : getProducts();
      const ranked = rankProductsByImageColor(pool, rgb);
      const ids = ranked.map((p) => p.id).slice(0, 48);
      const rankedIds = encodeURIComponent(ids.join(","));
      const qLabel = encodeURIComponent(t("visualSearchQuery"));
      router.push(`/search?q=${qLabel}&visual=1&rankedIds=${rankedIds}`);
    } catch {
      window.alert(t("visualSearchFailed"));
    } finally {
      setVisualBusy(false);
    }
  }

  const listId = "search-suggestions-list";

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listId}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={onVisualPick}
      />
      <div
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 transition",
          variant === "flipkart"
            ? "min-h-[2.5rem] rounded-sm border-0 bg-white shadow-inner ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-white/90"
            : "min-h-[2.75rem] rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm focus-within:border-[#0066ff]/45 focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#0066ff]/12 dark:border-slate-600/60 dark:bg-slate-900/80 dark:focus-within:border-[#0066ff]/50"
        )}
      >
        <Search
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            variant === "flipkart" ? "text-[#2874f0]" : "text-slate-400 dark:text-slate-500"
          )}
          strokeWidth={2}
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={t("placeholder")}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm font-medium outline-none",
            variant === "flipkart"
              ? "text-slate-900 placeholder:text-slate-500"
              : "text-slate-900 placeholder:text-slate-400 dark:text-slate-100"
          )}
          aria-autocomplete="list"
          aria-controls={listId}
        />
        <button
          type="button"
          onClick={startVoiceSearch}
          disabled={listening}
          className={cn(
            "shrink-0 rounded-lg p-1.5 transition",
            variant === "flipkart"
              ? "text-slate-500 hover:bg-slate-100 hover:text-[#2874f0]"
              : "text-slate-500 hover:bg-slate-100 hover:text-[var(--electric)] dark:text-slate-400 dark:hover:bg-slate-800",
            listening && "animate-pulse bg-[#0066ff]/10 text-[var(--electric)]"
          )}
          aria-label={listening ? t("voiceListening") : t("voiceSearch")}
          title={listening ? t("voiceListening") : t("voiceSearch")}
        >
          <Mic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={visualBusy}
          className={cn(
            "shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40",
            variant === "flipkart"
              ? "hover:text-[#2874f0]"
              : "hover:text-[var(--electric)] dark:text-slate-400 dark:hover:bg-slate-800"
          )}
          aria-label={visualBusy ? t("visualSearchWorking") : t("visualSearch")}
          title={visualBusy ? t("visualSearchWorking") : t("visualSearch")}
        >
          <Camera className={cn("h-3.5 w-3.5", visualBusy && "animate-pulse")} />
        </button>
        <button
          type="button"
          onClick={submit}
          className={cn(
            "hidden shrink-0 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition sm:block",
            variant === "flipkart"
              ? "rounded-sm bg-[#ff9f00] hover:bg-[#fb8c00]"
              : "rounded-xl bg-[#0066ff] hover:bg-[#0052cc]"
          )}
        >
          {t("submit")}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200/90 bg-white/95 py-2 shadow-[0_16px_48px_rgba(0,102,255,0.12)] backdrop-blur-xl"
            role="listbox"
          >
            {suggestions.map((p) => (
              <li key={p.id} role="option" aria-selected={false}>
                <Link
                  href={`/product/${p.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition hover:bg-[#0066ff]/5"
                  onClick={() => setOpen(false)}
                >
                  <span className="line-clamp-1 text-slate-900">{p.title}</span>
                  <span className="ml-auto text-xs font-semibold text-[#0066ff]/80">
                    {p.brand}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
