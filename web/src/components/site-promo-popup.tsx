"use client";

import { useEffect, useState } from "react";
import { getCms } from "@/lib/cms-storage";
import { X } from "lucide-react";

const SESSION_KEY = "lc_promo_dismissed";

export function SitePromoPopup() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-cms", fn);
    return () => window.removeEventListener("lc-cms", fn);
  }, []);

  useEffect(() => {
    void tick;
    const cms = getCms();
    if (!cms.popup.enabled) {
      setOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        setOpen(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, [tick]);

  void tick;
  const cms = getCms();
  if (!cms.popup.enabled || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/50 p-4 md:flex"
      role="presentation"
      onClick={() => {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setOpen(false);
      }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(SESSION_KEY, "1");
            } catch {
              /* ignore */
            }
            setOpen(false);
          }}
          className="absolute right-3 top-3 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {cms.popup.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cms.popup.imageUrl}
            alt=""
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
        ) : null}
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {cms.popup.title}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {cms.popup.body}
        </p>
        {cms.popup.couponCode ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#0066ff]/40 bg-[#0066ff]/5 px-4 py-3 text-center font-mono text-lg font-bold text-[#0066ff]">
            {cms.popup.couponCode}
          </p>
        ) : null}
      </div>
    </div>
  );
}
