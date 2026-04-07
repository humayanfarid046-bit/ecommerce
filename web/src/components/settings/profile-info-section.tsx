"use client";

import { useEffect, useId, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  readProfile,
  writeProfile,
  type Gender,
} from "@/lib/account-profile-storage";
import { useTranslations } from "next-intl";
import { Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

function looksLikeImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (!file.type && file.name) {
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.name);
  }
  return false;
}

async function fileToResizedDataUrl(
  file: File,
  maxDim = 512,
  maxChars = 950_000
): Promise<string> {
  if (!looksLikeImageFile(file)) {
    throw new Error("type");
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.9;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > maxChars && quality > 0.45) {
        quality -= 0.06;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      if (data.length > maxChars) {
        reject(new Error("large"));
        return;
      }
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

export function ProfileInfoSection() {
  const { user } = useAuth();
  const t = useTranslations("account");
  const photoInputIdRaw = useId();
  const photoInputId = `profile-photo-${photoInputIdRaw.replace(/:/g, "")}`;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [dob, setDob] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined
  );
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => {
      const p = readProfile();
      setName(p.displayName || user?.displayName || "");
      setPhone(p.phone);
      setGender(p.gender || "");
      setDob(p.dob);
      setPhoneVerified(p.phoneVerified);
      setPhotoDataUrl(p.photoDataUrl);
    };
    sync();
    window.addEventListener("lc-profile", sync);
    return () => window.removeEventListener("lc-profile", sync);
  }, [user?.displayName, user?.email]);

  async function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError(t("profilePhotoErrorLarge"));
      return;
    }
    setPhotoBusy(true);
    try {
      const attempts: readonly [number, number][] = [
        [512, 950_000],
        [384, 600_000],
        [256, 350_000],
        [192, 220_000],
      ];
      for (const [maxDim, maxChars] of attempts) {
        const data = await fileToResizedDataUrl(file, maxDim, maxChars).catch(
          () => null
        );
        if (!data) continue;
        if (writeProfile({ photoDataUrl: data })) {
          setPhotoDataUrl(data);
          return;
        }
      }
      setPhotoError(t("profilePhotoErrorStorage"));
    } catch {
      setPhotoError(t("profilePhotoErrorGeneric"));
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto() {
    setPhotoError(null);
    writeProfile({ photoDataUrl: "" });
    setPhotoDataUrl(undefined);
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    writeProfile({
      displayName: name.trim(),
      phone: phone.trim(),
      gender,
      dob,
      phoneVerified,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  function sendPhoneOtp() {
    if (!phone.trim()) return;
    setOtpSent(true);
  }

  function verifyOtp() {
    if (otpCode.trim().length >= 4) {
      setPhoneVerified(true);
      writeProfile({ phone: phone.trim(), phoneVerified: true });
      setOtpSent(false);
      setOtpCode("");
    }
  }

  return (
    <section className="glass rounded-2xl border border-slate-200/80 p-6 dark:border-slate-700/80">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <User className="h-5 w-5 text-[#0066ff]" />
        {t("personalInfo")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("personalInfoHint")}
      </p>

      <input
        id={photoInputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPhotoFile}
        disabled={photoBusy}
        tabIndex={-1}
        aria-label={t("profilePhotoChange")}
      />

      <form className="mt-6 space-y-6" onSubmit={saveProfile}>
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-600/60 dark:bg-slate-900/40 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#2874f0] to-[#7c3aed] ring-2 ring-white/40">
              {photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoDataUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white">
                  {(name.trim() || user?.displayName || user?.email || "?")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t("profilePhotoLabel")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("profilePhotoHint")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <label
              htmlFor={photoInputId}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
                photoBusy && "pointer-events-none opacity-60"
              )}
            >
              <Camera className="h-4 w-4" />
              {photoBusy ? t("profilePhotoUploading") : t("profilePhotoChange")}
            </label>
            {photoDataUrl ? (
              <button
                type="button"
                disabled={photoBusy}
                onClick={removePhoto}
                className="rounded-xl px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                {t("profilePhotoRemove")}
              </button>
            ) : null}
          </div>
          {photoError ? (
            <p className="w-full text-sm font-medium text-rose-600 dark:text-rose-400">
              {photoError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("fullName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              autoComplete="name"
            />
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("gender")}
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">{t("genderUnset")}</option>
              <option value="female">{t("genderFemale")}</option>
              <option value="male">{t("genderMale")}</option>
              <option value="other">{t("genderOther")}</option>
              <option value="prefer_not">{t("genderPreferNot")}</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 sm:col-span-2">
            {t("dateOfBirth")}
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="mt-1 block text-xs text-slate-400">
              {t("dobHint")}
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 sm:col-span-2">
            {t("email")}
            <input
              value={user?.email ?? ""}
              readOnly
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            <span className="mt-1 block text-xs text-slate-400">
              {t("emailReadonlyHint")}
            </span>
          </label>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("phone")}
              <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneVerified(false);
                  }}
                  placeholder={t("phonePlaceholder")}
                  className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {phoneVerified ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {t("phoneVerified")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendPhoneOtp}
                    className="shrink-0 rounded-xl border border-[#0066ff] bg-[#0066ff]/5 px-4 py-2 text-xs font-bold text-[#0066ff] hover:bg-[#0066ff]/10"
                  >
                    {t("sendOtpToPhone")}
                  </button>
                )}
              </div>
            </label>
            {otpSent && !phoneVerified && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  {t("otpSentHint")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={t("otpPlaceholder")}
                    className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    className="rounded-lg bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
                  >
                    {t("verifyOtp")}
                  </button>
                </div>
                <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-200/80">
                  {t("otpDemoHint")}
                </p>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("phoneChangeOtpPolicy")}
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#0066ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0052cc]"
        >
          {t("saveProfile")}
        </button>
        {savedMsg && (
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t("profileSaved")}
          </p>
        )}
      </form>
    </section>
  );
}
