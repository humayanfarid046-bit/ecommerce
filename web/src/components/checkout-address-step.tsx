"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { SavedAddress } from "@/lib/saved-address";
import {
  MapPin,
  Pencil,
  Sparkles,
  User,
  Mail,
  Home,
  Building2,
  Briefcase,
  MapPinned,
  CheckCircle2,
} from "lucide-react";
import { RippleButton } from "@/components/ripple-button";

type Props = {
  hasSaved: boolean;
  useGuestForm: boolean;
  setUseGuestForm: (v: boolean) => void;
  addresses: SavedAddress[];
  addrId: string;
  setAddrId: (id: string) => void;
  setEditAddr: (a: SavedAddress) => void;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  guestName: string;
  setGuestName: (v: string) => void;
  guestLine1: string;
  setGuestLine1: (v: string) => void;
  guestPin: string;
  setGuestPin: (v: string) => void;
  guestCity: string;
  setGuestCity: (v: string) => void;
  guestState: string;
  setGuestState: (v: string) => void;
  pinComplete: boolean;
  canPlaceAddress: boolean;
  onContinue: () => void;
  showMagicCheckout?: boolean;
  onMagicCheckout?: () => void;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-neutral-400 focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-[#0066ff]/25";

const labelClass =
  "block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";

function labelIcon(a: SavedAddress["label"]) {
  switch (a) {
    case "Home":
      return Home;
    case "Work":
    case "Office":
      return Briefcase;
    default:
      return Building2;
  }
}

export function CheckoutAddressStep({
  hasSaved,
  useGuestForm,
  setUseGuestForm,
  addresses,
  addrId,
  setAddrId,
  setEditAddr,
  guestEmail,
  setGuestEmail,
  guestName,
  setGuestName,
  guestLine1,
  setGuestLine1,
  guestPin,
  setGuestPin,
  guestCity,
  setGuestCity,
  guestState,
  setGuestState,
  pinComplete,
  canPlaceAddress,
  onContinue,
  showMagicCheckout,
  onMagicCheckout,
}: Props) {
  const t = useTranslations("checkout");
  const ta = useTranslations("account");

  function labelTitle(l: SavedAddress["label"]) {
    if (l === "Home") return ta("labelHome");
    if (l === "Office") return ta("labelOffice");
    if (l === "Work") return ta("labelWork");
    return ta("labelOther");
  }

  return (
    <div className="space-y-5 border-t border-neutral-200/80 p-4 pt-5 dark:border-slate-700 sm:p-5">
      {hasSaved && !useGuestForm ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <MapPin className="h-4 w-4 text-[#0066ff]" aria-hidden />
              {t("savedAddressesHint")}
            </p>
            <button
              type="button"
              onClick={() => setUseGuestForm(true)}
              className="text-xs font-bold text-[#0066ff] underline-offset-2 hover:underline"
            >
              {t("useNewAddress")}
            </button>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => {
              const selected = addrId === a.id;
              const Icon = labelIcon(a.label);
              return (
                <li key={a.id}>
                  <div
                    className={cn(
                      "relative flex h-full gap-0 overflow-hidden rounded-2xl border-2 transition",
                      selected
                        ? "border-[#0066ff] bg-gradient-to-br from-[#0066ff]/[0.07] via-white to-white shadow-[0_8px_30px_rgba(0,102,255,0.12)] dark:from-[#0066ff]/15 dark:via-slate-900 dark:to-slate-900"
                        : "border-neutral-200/90 bg-white hover:border-[#0066ff]/35 dark:border-slate-700 dark:bg-slate-900/50"
                    )}
                  >
                    {selected ? (
                      <div
                        className="w-1 shrink-0 bg-gradient-to-b from-[#0066ff] to-[#7c3aed]"
                        aria-hidden
                      />
                    ) : (
                      <div className="w-1 shrink-0 bg-transparent" aria-hidden />
                    )}
                    <label className="flex min-w-0 flex-1 cursor-pointer gap-3 p-4">
                      <input
                        type="radio"
                        name="addr"
                        checked={selected}
                        onChange={() => setAddrId(a.id)}
                        className="mt-1 h-4 w-4 shrink-0 border-neutral-300 text-[#0066ff] focus:ring-[#0066ff]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#0066ff]/20">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066ff]">
                            {labelTitle(a.label)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}
                        </p>
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                          <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          <span>
                            {a.city}
                            {a.state ? `, ${a.state}` : ""}
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {" "}
                              — {a.pin}
                            </span>
                          </span>
                        </p>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditAddr(a)}
                      className="shrink-0 self-start rounded-xl p-2.5 text-[#0066ff] transition hover:bg-[#0066ff]/10 dark:hover:bg-[#0066ff]/20"
                      aria-label={t("editAddress")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <MapPin className="h-4 w-4 text-[#0066ff]" aria-hidden />
              {t("guestDeliveryTitle")}
            </p>
            {hasSaved ? (
              <button
                type="button"
                onClick={() => setUseGuestForm(false)}
                className="text-xs font-bold text-[#0066ff] underline-offset-2 hover:underline"
              >
                {t("useSavedAddress")}
              </button>
            ) : null}
          </div>

          {showMagicCheckout && onMagicCheckout ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#0066ff]/25 bg-[#0066ff]/[0.06] px-4 py-3 dark:border-[#0066ff]/35 dark:bg-[#0066ff]/10">
              <Sparkles className="h-4 w-4 shrink-0 text-[#0066ff]" />
              <p className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {t("magicCheckoutTitle")}
              </p>
              <button
                type="button"
                onClick={onMagicCheckout}
                className="shrink-0 rounded-xl bg-[#0066ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0052cc]"
              >
                {t("magicCheckoutCta")}
              </button>
            </div>
          ) : null}

          {/* Contact */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-800/40">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <User className="h-3.5 w-3.5" />
              {t("addressSectionContact")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  {t("guestEmail")}
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@email.com"
                />
              </label>
              <label className={labelClass}>
                {t("guestFullName")}
                <input
                  type="text"
                  autoComplete="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={inputClass}
                  placeholder={t("fullNamePlaceholder")}
                />
              </label>
            </div>
          </div>

          {/* Street */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Home className="h-3.5 w-3.5" />
              {t("addressSectionStreet")}
            </p>
            <label className={labelClass}>
              {t("guestAddressLine")}
              <input
                type="text"
                autoComplete="street-address"
                value={guestLine1}
                onChange={(e) => setGuestLine1(e.target.value)}
                className={inputClass}
                placeholder={t("addressLinePlaceholder")}
              />
            </label>
          </div>

          {/* PIN + locality */}
          <div className="rounded-2xl border border-dashed border-[#0066ff]/25 bg-gradient-to-br from-[#0066ff]/[0.04] to-transparent p-4 dark:border-[#0066ff]/30 dark:from-[#0066ff]/10">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#0066ff] dark:text-[#7cb4ff]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("addressSectionPin")}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={cn(labelClass, "sm:col-span-1")}>
                {ta("pin")}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  value={guestPin}
                  onChange={(e) =>
                    setGuestPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={cn(
                    inputClass,
                    "text-center font-mono text-lg tracking-[0.2em]",
                    pinComplete && "border-emerald-400/80 ring-1 ring-emerald-400/30"
                  )}
                  placeholder="000000"
                />
              </label>
              <label className={cn(labelClass, "sm:col-span-1")}>
                {ta("city")}
                <input
                  type="text"
                  value={guestCity}
                  onChange={(e) => setGuestCity(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={cn(labelClass, "sm:col-span-1")}>
                {t("guestState")}
                <input
                  type="text"
                  value={guestState}
                  onChange={(e) => setGuestState(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            {pinComplete && guestCity.trim() ? (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t("pinLookupSuccess")}
              </p>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {t("pinAutoHint")}
              </p>
            )}
          </div>
        </div>
      )}

      <RippleButton
        type="button"
        disabled={!canPlaceAddress}
        onClick={onContinue}
        rippleClassName="bg-white/30"
        className={cn(
          "w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition",
          canPlaceAddress
            ? "bg-[#0066ff] shadow-[0_8px_24px_rgba(0,102,255,0.35)] hover:bg-[#0052cc]"
            : "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
        )}
      >
        {t("continueToSummary")}
      </RippleButton>
    </div>
  );
}
