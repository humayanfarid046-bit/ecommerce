"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

const TWO_FA_KEY = "libas_2fa_enabled";

function read2fa(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TWO_FA_KEY) === "1";
}

function write2fa(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TWO_FA_KEY, on ? "1" : "0");
}

export function SecuritySection() {
  const { logoutAllDevices } = useAuth();
  const t = useTranslations("account");

  const [twoFa, setTwoFa] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    setTwoFa(read2fa());
  }, []);

  function toggle2fa(v: boolean) {
    setTwoFa(v);
    write2fa(v);
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (!currentPw || !newPw) {
      setPwMsg(t("passwordFillAll"));
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg(t("passwordMismatch"));
      return;
    }
    setPwMsg(t("passwordUpdatedDemo"));
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  return (
    <section
      id="settings-security"
      className="glass scroll-mt-24 rounded-2xl border border-slate-200/80 p-6 dark:border-slate-700/80"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <Shield className="h-5 w-5 text-[#0066ff]" />
        {t("securityTitle")}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {t("securitySubtitle")}
      </p>

      <form
        className="mt-6 space-y-4 border-b border-slate-100 pb-8 dark:border-slate-700"
        onSubmit={submitPassword}
      >
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {t("changePasswordTitle")}
        </h3>
        <label className="block text-xs font-medium text-slate-500">
          {t("currentPassword")}
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            className="mt-1 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="current-password"
          />
        </label>
        <label className="block text-xs font-medium text-slate-500">
          {t("newPassword")}
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="mt-1 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="new-password"
          />
        </label>
        <label className="block text-xs font-medium text-slate-500">
          {t("confirmNewPassword")}
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="mt-1 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="new-password"
          />
        </label>
        {pwMsg && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {pwMsg}
          </p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {t("updatePassword")}
        </button>
        <p className="text-xs text-slate-400">{t("passwordDemoNote")}</p>
      </form>

      <div className="mt-8 flex flex-col gap-4 border-b border-slate-100 pb-8 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t("twoFactor")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("twoFactorDescription")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={twoFa}
          onClick={() => toggle2fa(!twoFa)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${
            twoFa ? "bg-[#0066ff]" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              twoFa ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {t("loggedInDevices")}
        </h3>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {t("devicesListEmpty")}
        </p>
        <button
          type="button"
          onClick={() => void logoutAllDevices()}
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
        >
          {t("logoutAllDevices")}
        </button>
        <p className="mt-2 text-xs text-slate-400">{t("logoutAllHint")}</p>
      </div>

    </section>
  );
}
