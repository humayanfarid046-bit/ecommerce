"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  defaultShippingRules,
  getShippingRules,
  saveShippingRules,
  computeDeliveryQuote,
  type ShippingRulesState,
  type PinShippingRule,
} from "@/lib/shipping-rules-storage";
import {
  getTaxShippingConfig,
  saveTaxShippingConfig,
  getActivityLogs,
  appendActivityLog,
  getDeliveryOpsPolicy,
  saveDeliveryOpsPolicy,
  type ActivityLogEntry,
} from "@/lib/admin-security-storage";
import {
  Lock,
  Receipt,
  ScrollText,
  Settings2,
  Shield,
  Sparkles,
  Truck,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type SettingsTab = "shipping" | "finance" | "security" | "audit";

function SettingsSectionCard({
  children,
  className,
  accent = "sky",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "sky" | "emerald" | "violet" | "amber" | "slate";
}) {
  const accents: Record<typeof accent, string> = {
    sky: "border-sky-100/90 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/50 shadow-sm shadow-sky-100/30 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950",
    emerald:
      "border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/35 to-teal-50/45 shadow-sm shadow-emerald-100/25 dark:border-emerald-900/40 dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-950",
    violet:
      "border-violet-100/90 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/35 shadow-sm shadow-violet-100/25 dark:border-violet-900/30 dark:from-slate-900 dark:via-violet-950/20 dark:to-slate-950",
    amber:
      "border-amber-100/90 bg-gradient-to-br from-white via-amber-50/35 to-orange-50/40 shadow-sm shadow-amber-100/20 dark:border-amber-900/30 dark:from-slate-900 dark:via-amber-950/15 dark:to-slate-950",
    slate:
      "border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/40 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950",
  };
  return (
    <div className={cn("rounded-2xl border p-5 md:p-6", accents[accent], className)}>
      {children}
    </div>
  );
}

function scopeBadgeClass(scope: string | undefined): string {
  const s = (scope ?? "").toLowerCase();
  if (s === "owner")
    return "bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200";
  if (s === "operations")
    return "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200";
  if (s === "catalog")
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function AdminSettings() {
  const t = useTranslations("admin");
  const { user, refreshAccessScope } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("shipping");
  const [tax, setTax] = useState("18");
  const [shipMetro, setShipMetro] = useState("40");
  const [shipRest, setShipRest] = useState("60");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);
  const [bootstrapBusy, setBootstrapBusy] = useState(false);
  const [riderTokenExpiryHours, setRiderTokenExpiryHours] = useState<6 | 12 | 24>(12);
  const bootstrapEnabled = process.env.NEXT_PUBLIC_ADMIN_BOOTSTRAP_ENABLED === "true";

  const [rules, setRules] = useState<ShippingRulesState>(defaultShippingRules);
  const [previewSub, setPreviewSub] = useState("450");
  const [previewPin, setPreviewPin] = useState("700016");
  const [previewCod, setPreviewCod] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const shipLogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRules(getShippingRules());
    const cfg = getTaxShippingConfig();
    setTax(String(cfg.taxPercent));
    setShipMetro(String(cfg.metroFlat));
    setShipRest(String(cfg.restFlat));
    setRiderTokenExpiryHours(getDeliveryOpsPolicy().riderTokenExpiryHours);
    setLogs(getActivityLogs());
    void (async () => {
      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/admin/delivery-policy", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = (await res.json().catch(() => ({}))) as {
          policy?: { riderTokenExpiryHours?: number };
        };
        const h = Number(j.policy?.riderTokenExpiryHours);
        if (res.ok && (h === 6 || h === 12 || h === 24)) {
          setRiderTokenExpiryHours(h);
          saveDeliveryOpsPolicy({ riderTokenExpiryHours: h }, { log: false });
        }
      } catch {
        /* ignore, keep local fallback */
      }
    })();
    const fn = () => {
      setRules(getShippingRules());
    };
    const fnTax = () => {
      const c = getTaxShippingConfig();
      setTax(String(c.taxPercent));
      setShipMetro(String(c.metroFlat));
      setShipRest(String(c.restFlat));
      setRiderTokenExpiryHours(getDeliveryOpsPolicy().riderTokenExpiryHours);
    };
    const fnAct = () => setLogs(getActivityLogs());
    window.addEventListener("lc-shipping-rules", fn);
    window.addEventListener("lc-admin-settings", fnTax);
    window.addEventListener("lc-admin-activity", fnAct);
    return () => {
      window.removeEventListener("lc-shipping-rules", fn);
      window.removeEventListener("lc-admin-settings", fnTax);
      window.removeEventListener("lc-admin-activity", fnAct);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function persist(next: ShippingRulesState) {
    setRules(next);
    saveShippingRules(next);
    if (shipLogTimer.current) clearTimeout(shipLogTimer.current);
    shipLogTimer.current = setTimeout(() => {
      appendActivityLog({
        actor: "admin",
        action: "settings.shipping_rules_updated",
        detail: `free≥${next.freeShippingMin} · ${next.pinRules.length} PIN rules`,
      });
      shipLogTimer.current = null;
    }, 550);
  }

  function updatePinRule(index: number, patch: Partial<PinShippingRule>) {
    const next = { ...rules, pinRules: [...rules.pinRules] };
    next.pinRules[index] = { ...next.pinRules[index], ...patch };
    persist(next);
  }

  function addPinRule() {
    persist({
      ...rules,
      pinRules: [...rules.pinRules, { pinPrefix: "", label: "", fee: 40 }],
    });
  }

  function removePinRule(index: number) {
    persist({
      ...rules,
      pinRules: rules.pinRules.filter((_, i) => i !== index),
    });
  }

  const quote = computeDeliveryQuote(Number(previewSub) || 0, previewPin, previewCod);

  const tabItems: {
    id: SettingsTab;
    icon: typeof Truck;
    label: string;
  }[] = [
    { id: "shipping", icon: Truck, label: t("settingsTabShipping") },
    { id: "finance", icon: Receipt, label: t("settingsTabFinance") },
    { id: "security", icon: Shield, label: t("settingsTabSecurity") },
    { id: "audit", icon: ScrollText, label: t("settingsTabAudit") },
  ];

  const scopeLabel =
    user?.accessScopeReady && user.accessScope
      ? user.accessScope
      : user?.accessScopeReady === false
        ? "…"
        : t("scopeNone");

  return (
    <div className="relative space-y-8">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[100] max-w-md rounded-xl border border-emerald-500/30 bg-emerald-950 px-4 py-3 text-sm font-semibold text-emerald-50 shadow-xl dark:bg-emerald-950/95"
        >
          {toast}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-3xl border border-sky-100/80 bg-gradient-to-r from-[#0066ff]/[0.12] via-violet-500/[0.08] to-emerald-100/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#7c3aed] text-white shadow-lg shadow-indigo-300/30 dark:shadow-indigo-950/40">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0066ff]">
                {t("settingsHeroEyebrow")}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {t("settingsTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("settingsSubtitle")}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("settingsHeroHint")}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs font-semibold shadow-inner backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">{t("accessCurrent")}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                scopeBadgeClass(user?.accessScope)
              )}
            >
              {scopeLabel}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/75"
        role="tablist"
        aria-label={t("settingsTabListAria")}
      >
        {tabItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
              tab === id
                ? "bg-gradient-to-r from-[#0066ff] to-[#7c3aed] text-white shadow-md shadow-indigo-300/35 dark:shadow-indigo-950/40"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {tab === "shipping" && (
        <SettingsSectionCard accent="sky">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Truck className="h-5 w-5 text-[#0066ff]" />
            {t("shippingRulesTitle")}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("shippingRulesHint")}</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("freeShippingThreshold")}
              <input
                type="number"
                min={0}
                value={rules.freeShippingMin}
                onChange={(e) =>
                  persist({ ...rules, freeShippingMin: Number(e.target.value) || 0 })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("feeBelowThreshold")}
              <input
                type="number"
                min={0}
                value={rules.feeBelowMin}
                onChange={(e) =>
                  persist({ ...rules, feeBelowMin: Number(e.target.value) || 0 })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("defaultPinFee")}
              <input
                type="number"
                min={0}
                value={rules.defaultPinFee}
                onChange={(e) =>
                  persist({ ...rules, defaultPinFee: Number(e.target.value) || 0 })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("codHandlingFee")}
              <input
                type="number"
                min={0}
                value={rules.codHandlingFee}
                onChange={(e) =>
                  persist({ ...rules, codHandlingFee: Number(e.target.value) || 0 })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("pinRulesTitle")}
          </p>
          <div className="mt-3 space-y-2">
            {rules.pinRules.map((row, i) => (
              <div
                key={i}
                className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200/90 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-950/40"
              >
                <label className="text-[10px] font-bold text-slate-500">
                  {t("pinPrefix")}
                  <input
                    value={row.pinPrefix}
                    onChange={(e) => updatePinRule(i, { pinPrefix: e.target.value })}
                    placeholder="700"
                    className="mt-0.5 block w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                </label>
                <label className="min-w-[120px] flex-1 text-[10px] font-bold text-slate-500">
                  {t("pinRuleLabel")}
                  <input
                    value={row.label}
                    onChange={(e) => updatePinRule(i, { label: e.target.value })}
                    className="mt-0.5 block w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                </label>
                <label className="text-[10px] font-bold text-slate-500">
                  {t("pinRuleFee")}
                  <input
                    type="number"
                    min={0}
                    value={row.fee}
                    onChange={(e) =>
                      updatePinRule(i, { fee: Number(e.target.value) || 0 })
                    }
                    className="mt-0.5 block w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removePinRule(i)}
                  className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  aria-label={t("pinRuleRemoveAria")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPinRule}
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#0066ff]/50 hover:text-[#0066ff] dark:border-slate-600"
          >
            <Plus className="h-4 w-4" />
            {t("addPinRule")}
          </button>

          <div className="mt-6 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("shippingPreview")}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="text-[10px] font-bold text-slate-500">
                {t("previewSubtotal")}
                <input
                  value={previewSub}
                  onChange={(e) => setPreviewSub(e.target.value)}
                  className="mt-1 block w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                {t("previewPin")}
                <input
                  value={previewPin}
                  onChange={(e) => setPreviewPin(e.target.value)}
                  className="mt-1 block w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="flex items-center gap-2 pt-5 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={previewCod}
                  onChange={(e) => setPreviewCod(e.target.checked)}
                />
                {t("previewCodLabel")}
              </label>
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              {t("previewDelivery")}: ₹{quote.deliveryFee.toLocaleString("en-IN")} ·{" "}
              {t("previewCodFee")}: ₹{quote.codHandling.toLocaleString("en-IN")} ·{" "}
              {quote.freeShippingApplied ? t("previewFreeShip") : t("previewPaidShip")}
              {quote.matchedRuleLabel ? ` · ${quote.matchedRuleLabel}` : ""}
            </p>
          </div>
        </SettingsSectionCard>
      )}

      {tab === "finance" && (
        <SettingsSectionCard accent="emerald">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Receipt className="h-5 w-5 text-emerald-600" />
            {t("taxShipping")}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("taxShippingNote")}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("gstPercent")}
              <input
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("shipMetro")}
              <input
                value={shipMetro}
                onChange={(e) => setShipMetro(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("shipRest")}
              <input
                value={shipRest}
                onChange={(e) => setShipRest(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>
          <button
            type="button"
            className="mt-6 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-300/30 dark:shadow-indigo-950/40"
            onClick={() => {
              saveTaxShippingConfig({
                taxPercent: Math.min(99, Math.max(0, Number(tax) || 0)),
                metroFlat: Math.max(0, Number(shipMetro) || 0),
                restFlat: Math.max(0, Number(shipRest) || 0),
              });
              setToast(t("settingsSavedToast"));
            }}
          >
            {t("saveRules")}
          </button>
        </SettingsSectionCard>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <SettingsSectionCard accent="violet">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <Lock className="h-5 w-5 text-violet-600" />
              {t("accessTitle")}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("accessHint")}</p>
            <label className="mt-4 block text-xs font-bold text-slate-600 dark:text-slate-300">
              {t("accessCurrent")}
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                    scopeBadgeClass(user?.accessScope)
                  )}
                >
                  {scopeLabel}
                </span>
              </div>
            </label>
            {bootstrapEnabled && user?.accessScopeReady && user.accessScope !== "owner" ? (
              <div className="mt-5 rounded-xl border border-amber-200/90 bg-amber-50/90 p-4 text-xs text-slate-800 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-50">
                <p className="font-extrabold text-amber-950 dark:text-amber-100">{t("bootstrapTitle")}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-amber-900/95 dark:text-amber-100/90">
                  {t("bootstrapBody", {
                    owner: t("scopeOwner"),
                    path: user?.uid ? `users/${user.uid}/profile/account` : "users/…/profile/account",
                  })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="password"
                    value={bootstrapSecret}
                    onChange={(e) => setBootstrapSecret(e.target.value)}
                    placeholder={t("bootstrapPlaceholder")}
                    className="min-w-[200px] flex-1 rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-xs dark:border-amber-900/50 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    disabled={bootstrapBusy || !bootstrapSecret.trim()}
                    onClick={async () => {
                      setBootstrapMsg(null);
                      setBootstrapBusy(true);
                      try {
                        const token = await getFirebaseAuth()?.currentUser?.getIdToken();
                        if (!token) {
                          setBootstrapMsg(t("bootstrapSignIn"));
                          return;
                        }
                        const res = await fetch("/api/admin/bootstrap-owner", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ secret: bootstrapSecret }),
                        });
                        const j = (await res.json().catch(() => ({}))) as {
                          ok?: boolean;
                          error?: string;
                        };
                        if (!res.ok || !j.ok) {
                          setBootstrapMsg(j.error ?? t("bootstrapFail"));
                          return;
                        }
                        await refreshAccessScope();
                        setBootstrapMsg(t("bootstrapSuccess"));
                        setToast(t("settingsScopeRefreshed"));
                      } catch (e) {
                        setBootstrapMsg(e instanceof Error ? e.message : t("bootstrapFail"));
                      } finally {
                        setBootstrapBusy(false);
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bootstrapBusy ? t("bootstrapWorking") : t("bootstrapBtn")}
                  </button>
                </div>
                {bootstrapMsg ? (
                  <p className="mt-2 text-[11px] font-medium text-amber-950 dark:text-amber-100">
                    {bootstrapMsg}
                  </p>
                ) : null}
              </div>
            ) : null}
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t("accessOperations")}</span>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                  {t("permOrdersHint")}
                </span>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t("accessCatalog")}</span>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                  {t("permCatalogHint")}
                </span>
              </li>
            </ul>
            <div className="mt-5 rounded-xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Delivery Ops Policy
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Rider link token expiry duration for delivery interface.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[6, 12, 24].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setRiderTokenExpiryHours(h as 6 | 12 | 24)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-bold",
                      riderTokenExpiryHours === h
                        ? "border-[#0066ff] bg-[#0066ff] text-white"
                        : "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={async () => {
                  saveDeliveryOpsPolicy({ riderTokenExpiryHours }, { log: false });
                  try {
                    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
                    if (!token) {
                      setToast("Policy saved locally. Sign in to sync server policy.");
                      return;
                    }
                    const res = await fetch("/api/admin/delivery-policy", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ riderTokenExpiryHours }),
                    });
                    const j = (await res.json().catch(() => ({}))) as { error?: string };
                    if (!res.ok) {
                      setToast(j.error ?? "Server policy save failed.");
                      return;
                    }
                    saveDeliveryOpsPolicy({ riderTokenExpiryHours });
                    setToast("Delivery ops policy saved (server enforced).");
                  } catch {
                    setToast("Policy saved locally; server sync failed.");
                  }
                }}
                className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white"
              >
                Save Delivery Policy
              </button>
            </div>
          </SettingsSectionCard>
        </div>
      )}

      {tab === "audit" && (
        <SettingsSectionCard accent="slate">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
              <ScrollText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {t("activityLogs")}
            </div>
            <button
              type="button"
              className="text-xs font-bold text-[#0066ff] hover:underline"
              onClick={() => {
                appendActivityLog({
                  actor: "admin",
                  action: "audit.note",
                  detail: t("activityManualNote"),
                });
                setLogs(getActivityLogs());
              }}
            >
              {t("activityAddTest")}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("activityLogsHint")}</p>
          <ul className="mt-4 max-h-[28rem] space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-white/60 p-2 text-sm dark:border-slate-800 dark:bg-slate-950/30">
            {logs.length === 0 ? (
              <li className="px-2 py-6 text-center text-slate-400">{t("activityEmpty")}</li>
            ) : (
              logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-transparent px-3 py-2 hover:border-slate-100 hover:bg-slate-50/80 dark:hover:border-slate-800 dark:hover:bg-slate-900/50"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#0066ff]">{log.actor}</span>
                    <time className="text-xs text-slate-400" dateTime={log.at}>
                      {new Date(log.at).toLocaleString()}
                    </time>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{log.action}</span>
                  {log.detail ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{log.detail}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </SettingsSectionCard>
      )}
    </div>
  );
}
