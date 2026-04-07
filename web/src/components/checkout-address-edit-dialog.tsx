"use client";

import { useEffect, useRef, useState } from "react";
import type { AddressLabel, SavedAddress } from "@/lib/saved-address";
import { applyPinLookupIfNew } from "@/lib/pin-lookup";
import { useTranslations } from "next-intl";
import { MapPin, Sparkles, X } from "lucide-react";

type Props = {
  open: boolean;
  address: SavedAddress | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Omit<SavedAddress, "id">>) => void;
};

const field =
  "mt-1.5 w-full rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#0066ff] focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export function CheckoutAddressEditDialog({
  open,
  address,
  onClose,
  onSave,
}: Props) {
  const t = useTranslations("checkout");
  const ta = useTranslations("account");
  const [form, setForm] = useState({
    label: "Home" as AddressLabel,
    line1: "",
    line2: "",
    city: "",
    pin: "",
    state: "",
  });
  const [err, setErr] = useState<string | null>(null);
  /** Pre-seed so opening the dialog does not re-run lookup over saved city/state. */
  const pinLookupRef = useRef<string>("");

  useEffect(() => {
    if (!address) return;
    const norm = address.pin.replace(/\D/g, "").slice(0, 6);
    pinLookupRef.current = norm.length === 6 ? norm : "";
    setForm({
      label: address.label,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      pin: address.pin,
      state: address.state ?? "",
    });
    setErr(null);
  }, [address]);

  useEffect(() => {
    const r = applyPinLookupIfNew(form.pin, pinLookupRef);
    if (r) {
      setForm((f) => ({ ...f, city: r.city, state: r.state }));
    }
  }, [form.pin]);

  if (!open || !address) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!address) return;
    if (!form.line1.trim() || !form.city.trim()) {
      setErr(ta("required"));
      return;
    }
    if (!/^\d{6}$/.test(form.pin.trim())) {
      setErr(ta("invalidPin"));
      return;
    }
    onSave(address.id, {
      label: form.label,
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      pin: form.pin.trim(),
      state: form.state.trim() || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        role="dialog"
        aria-modal
        aria-labelledby="addr-edit-title"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0066ff] via-[#0066ff] to-[#7c3aed] px-5 py-5 text-white">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="addr-edit-title" className="text-lg font-bold tracking-tight">
                  {t("editAddress")}
                </h2>
                <p className="mt-0.5 text-xs text-white/85">{t("editAddressSubtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label={t("closeDialog")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {ta("label")}
            <select
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value as AddressLabel }))
              }
              className={field}
            >
              <option value="Home">{ta("labelHome")}</option>
              <option value="Work">{ta("labelWork")}</option>
              <option value="Office">{ta("labelOffice")}</option>
              <option value="Other">{ta("labelOther")}</option>
            </select>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {ta("line1")}
            <input
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              className={field}
            />
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {ta("line2")}
            <input
              value={form.line2}
              onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              className={field}
            />
          </label>
          <div className="rounded-2xl border border-dashed border-[#0066ff]/25 bg-[#0066ff]/[0.03] p-4 dark:border-[#0066ff]/35 dark:bg-[#0066ff]/10">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#0066ff] dark:text-[#7cb4ff]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("addressSectionPin")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {ta("pin")}
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pin}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  className={`${field} text-center font-mono text-lg tracking-[0.15em]`}
                />
              </label>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {ta("city")}
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className={field}
                />
              </label>
            </div>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {t("guestState")}
              <input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={field}
              />
            </label>
          </div>
          {err ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err}</p>
          ) : null}
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("pinAutoHint")}</p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#0066ff] py-3 text-sm font-semibold text-white shadow-lg shadow-[#0066ff]/25 transition hover:bg-[#0052cc]"
            >
              {ta("saveAddress")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
