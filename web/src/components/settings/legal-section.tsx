"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FileText, ShieldAlert, Truck, Cookie } from "lucide-react";

export function LegalSection() {
  const t = useTranslations("account");
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <section className="glass rounded-[18px] border border-slate-200/80 p-6 dark:border-slate-700/80">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <ShieldAlert className="h-5 w-5 text-[#0066ff]" />
        {t("legalTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("legalSubtitle")}
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <FileText className="h-4 w-4" />
          {t("privacyPolicy")}
        </Link>
        <Link
          href="/terms"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <FileText className="h-4 w-4" />
          {t("termsOfService")}
        </Link>
        <Link
          href="/shipping"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Truck className="h-4 w-4" />
          {t("shippingPolicy")}
        </Link>
        <Link
          href="/cookies"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Cookie className="h-4 w-4" />
          {t("cookiePolicy")}
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-8 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setShowDeactivate(true)}
          className="w-fit text-left text-sm font-bold text-amber-700 hover:underline dark:text-amber-400"
        >
          {t("deactivateAccount")}
        </button>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="w-fit text-left text-sm font-bold text-rose-600 hover:underline dark:text-rose-400"
        >
          {t("deleteAccount")}
        </button>
      </div>

      {showDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-[18px] bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("deactivateTitle")}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("deactivateBody")}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeactivate(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-600"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => setShowDeactivate(false)}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white"
              >
                {t("confirmDeactivateDemo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-[18px] bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400">
              {t("deleteTitle")}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("deleteBody")}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-600"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
              >
                {t("confirmDeleteDemo")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
