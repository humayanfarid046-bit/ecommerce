"use client";

import { useEffect, useState } from "react";
import {
  useAddresses,
  type AddressLabel,
  type SavedAddress,
} from "@/context/addresses-context";
import { useTranslations } from "next-intl";
import { MapPin, Navigation, Star } from "lucide-react";
const DEFAULT_KEY = "ecom_default_address_id";

function readDefaultId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DEFAULT_KEY);
  } catch {
    return null;
  }
}

function writeDefaultId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(DEFAULT_KEY, id);
    else localStorage.removeItem(DEFAULT_KEY);
  } catch {
    /* ignore */
  }
}

export function AccountAddressSection() {
  const { addresses, add, update, remove } = useAddresses();
  const t = useTranslations("account");

  const [defaultId, setDefaultId] = useState<string | null>(null);

  useEffect(() => {
    setDefaultId(readDefaultId());
  }, []);

  useEffect(() => {
    if (!defaultId) return;
    if (!addresses.some((a) => a.id === defaultId)) {
      setDefaultId(null);
      writeDefaultId(null);
    }
  }, [addresses, defaultId]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    label: AddressLabel;
    line1: string;
    line2: string;
    city: string;
    pin: string;
  }>({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    pin: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(
    null
  );

  function resetForm() {
    setForm({
      label: "Home",
      line1: "",
      line2: "",
      city: "",
      pin: "",
    });
    setEditingId(null);
    setFormError(null);
    setPinned(null);
  }

  function startEdit(a: SavedAddress) {
    setEditingId(a.id);
    setForm({
      label: a.label,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      pin: a.pin,
    });
    setFormError(null);
    if (
      typeof a.lat === "number" &&
      typeof a.lng === "number" &&
      Number.isFinite(a.lat) &&
      Number.isFinite(a.lng)
    ) {
      setPinned({ lat: a.lat, lng: a.lng });
    } else {
      setPinned(null);
    }
  }

  function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.line1.trim() || !form.city.trim()) {
      setFormError(t("required"));
      return;
    }
    if (!/^\d{6}$/.test(form.pin.trim())) {
      setFormError(t("invalidPin"));
      return;
    }
    const payload: Omit<SavedAddress, "id"> = {
      label: form.label,
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      pin: form.pin.trim(),
    };
    if (pinned) {
      payload.lat = pinned.lat;
      payload.lng = pinned.lng;
    }
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    resetForm();
  }

  function setAsDefault(id: string) {
    setDefaultId(id);
    writeDefaultId(id);
  }

  function labelTitle(label: AddressLabel) {
    if (label === "Home") return t("labelHome");
    if (label === "Work") return t("labelWork");
    if (label === "Office") return t("labelOffice");
    return t("labelOther");
  }

  async function detectCurrentLocation() {
    setFormError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setFormError(t("gpsNotSupported"));
      return;
    }
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      });
      const { latitude, longitude } = pos.coords;
      setPinned({ lat: latitude, lng: longitude });
      const res = await fetch(
        `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`
      );
      if (!res.ok) throw new Error("geo");
      const data = (await res.json()) as {
        line1?: string;
        city?: string;
        pin?: string;
      };
      setForm((f) => ({
        ...f,
        line1: data.line1 ?? f.line1,
        city: data.city && data.city !== "—" ? data.city : f.city,
        pin: data.pin && /^\d{6}$/.test(data.pin) ? data.pin : f.pin,
      }));
    } catch {
      setFormError(t("gpsFailed"));
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <section id="settings-addresses" className="scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <MapPin className="h-5 w-5 text-[#0066ff]" />
        {t("addressBook")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("addressBookHint")}
      </p>

      <ul className="mt-4 space-y-3">
        {addresses.map((a) => {
          const isDefault = defaultId === a.id;
          return (
            <li
              key={a.id}
              className="glass flex flex-wrap items-start justify-between gap-3 rounded-[18px] border border-slate-200/80 p-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase text-[#0066ff]">
                    {labelTitle(a.label)}
                  </span>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-600" />
                      {t("defaultAddress")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </p>
                <p className="text-sm text-slate-500">
                  {a.city} — {a.pin}
                </p>
                {typeof a.lat === "number" &&
                typeof a.lng === "number" &&
                Number.isFinite(a.lat) &&
                Number.isFinite(a.lng) ? (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {t("mapPinSaved")}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => setAsDefault(a.id)}
                    className="text-xs font-bold text-[#0066ff] hover:underline"
                  >
                    {t("setDefault")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="text-sm font-semibold text-[#0066ff] hover:underline"
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  {t("delete")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={submitAddress}
        className="glass mt-6 space-y-3 rounded-[18px] border border-slate-200/80 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {editingId ? t("edit") : t("addAddress")}
          </p>
          <button
            type="button"
            disabled={gpsLoading}
            onClick={() => void detectCurrentLocation()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#0066ff]/40 bg-[#0066ff]/5 px-3 py-2 text-xs font-bold text-[#0066ff] transition hover:bg-[#0066ff]/10 disabled:opacity-50"
          >
            <Navigation className="h-3.5 w-3.5" />
            {gpsLoading ? t("gpsDetecting") : t("useCurrentLocation")}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-500">
            {t("label")}
            <select
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  label: e.target.value as AddressLabel,
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="Home">{t("labelHome")}</option>
              <option value="Work">{t("labelWork")}</option>
              <option value="Office">{t("labelOffice")}</option>
              <option value="Other">{t("labelOther")}</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-500">
            {t("pin")}
            <input
              value={form.pin}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              maxLength={6}
              inputMode="numeric"
            />
          </label>
          <label className="block text-xs font-medium text-slate-500 sm:col-span-2">
            {t("line1")}
            <input
              value={form.line1}
              onChange={(e) =>
                setForm((f) => ({ ...f, line1: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block text-xs font-medium text-slate-500 sm:col-span-2">
            {t("line2")}
            <input
              value={form.line2}
              onChange={(e) =>
                setForm((f) => ({ ...f, line2: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block text-xs font-medium text-slate-500 sm:col-span-2">
            {t("city")}
            <input
              value={form.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, city: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>
        {pinned ? (
          <div className="space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                {t("mapPreviewTitle")}
              </p>
              <button
                type="button"
                onClick={() => setPinned(null)}
                className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
              >
                {t("clearMapPin")}
              </button>
            </div>
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://staticmap.openstreetmap.de/staticmap.php?center=${pinned.lat},${pinned.lng}&zoom=15&size=600x300&maptype=mapnik`}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {t("mapPreviewHint")}
            </p>
          </div>
        ) : null}
        {formError && <p className="text-sm text-rose-600">{formError}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white hover:bg-[#0052cc]"
          >
            {t("saveAddress")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {t("cancel")}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
