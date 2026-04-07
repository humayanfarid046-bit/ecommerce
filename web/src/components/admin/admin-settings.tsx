"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  defaultShippingRules,
  getShippingRules,
  computeDeliveryQuote,
  type ShippingRulesState,
  type PinShippingRule,
} from "@/lib/shipping-rules-storage";
import {
  getTaxShippingConfig,
  saveTaxShippingConfig,
  getActivityLogs,
  appendActivityLog,
  saveShippingRulesWithActivity,
  type ActivityLogEntry,
} from "@/lib/admin-security-storage";
import { Lock, ScrollText, Truck, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function AdminSettings() {
  const t = useTranslations("admin");
  const { user } = useAuth();
  const [tax, setTax] = useState("18");
  const [shipMetro, setShipMetro] = useState("40");
  const [shipRest, setShipRest] = useState("60");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  const [rules, setRules] = useState<ShippingRulesState>(defaultShippingRules);
  const [previewSub, setPreviewSub] = useState("450");
  const [previewPin, setPreviewPin] = useState("700016");
  const [previewCod, setPreviewCod] = useState(true);
  useEffect(() => {
    setRules(getShippingRules());
    const cfg = getTaxShippingConfig();
    setTax(String(cfg.taxPercent));
    setShipMetro(String(cfg.metroFlat));
    setShipRest(String(cfg.restFlat));
    setLogs(getActivityLogs());
    const fn = () => {
      setRules(getShippingRules());
    };
    const fnTax = () => {
      const c = getTaxShippingConfig();
      setTax(String(c.taxPercent));
      setShipMetro(String(c.metroFlat));
      setShipRest(String(c.restFlat));
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

  function persist(next: ShippingRulesState) {
    setRules(next);
    saveShippingRulesWithActivity(next);
  }

  function updatePinRule(
    index: number,
    patch: Partial<PinShippingRule>
  ) {
    const next = { ...rules, pinRules: [...rules.pinRules] };
    next.pinRules[index] = { ...next.pinRules[index], ...patch };
    persist(next);
  }

  function addPinRule() {
    persist({
      ...rules,
      pinRules: [
        ...rules.pinRules,
        { pinPrefix: "", label: "", fee: 40 },
      ],
    });
  }

  function removePinRule(index: number) {
    persist({
      ...rules,
      pinRules: rules.pinRules.filter((_, i) => i !== index),
    });
  }

  const quote = computeDeliveryQuote(
    Number(previewSub) || 0,
    previewPin,
    previewCod
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("settingsTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("settingsSubtitle")}</p>
      </div>

      <div className="rounded-2xl border border-[#0066ff]/25 bg-gradient-to-br from-[#0066ff]/[0.06] to-white p-5 dark:border-[#0066ff]/30 dark:from-[#0066ff]/10 dark:to-slate-900">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Truck className="h-5 w-5 text-[#0066ff]" />
          {t("shippingRulesTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("shippingRulesHint")}</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-xs font-bold text-slate-500">
            {t("freeShippingThreshold")}
            <input
              type="number"
              min={0}
              value={rules.freeShippingMin}
              onChange={(e) =>
                persist({ ...rules, freeShippingMin: Number(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("feeBelowThreshold")}
            <input
              type="number"
              min={0}
              value={rules.feeBelowMin}
              onChange={(e) =>
                persist({ ...rules, feeBelowMin: Number(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("defaultPinFee")}
            <input
              type="number"
              min={0}
              value={rules.defaultPinFee}
              onChange={(e) =>
                persist({ ...rules, defaultPinFee: Number(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            {t("codHandlingFee")}
            <input
              type="number"
              min={0}
              value={rules.codHandlingFee}
              onChange={(e) =>
                persist({ ...rules, codHandlingFee: Number(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
        </div>

        <p className="mt-4 text-xs font-bold uppercase text-slate-500">
          {t("pinRulesTitle")}
        </p>
        <div className="mt-2 space-y-2">
          {rules.pinRules.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-600 dark:bg-slate-950/50"
            >
              <label className="text-[10px] font-bold text-slate-500">
                {t("pinPrefix")}
                <input
                  value={row.pinPrefix}
                  onChange={(e) => updatePinRule(i, { pinPrefix: e.target.value })}
                  placeholder="700"
                  className="mt-0.5 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="min-w-[120px] flex-1 text-[10px] font-bold text-slate-500">
                {t("pinRuleLabel")}
                <input
                  value={row.label}
                  onChange={(e) => updatePinRule(i, { label: e.target.value })}
                  className="mt-0.5 block w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
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
                  className="mt-0.5 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <button
                type="button"
                onClick={() => removePinRule(i)}
                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPinRule}
          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-600"
        >
          <Plus className="h-4 w-4" />
          {t("addPinRule")}
        </button>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-xs font-bold uppercase text-slate-500">{t("shippingPreview")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="text-[10px] font-bold text-slate-500">
              {t("previewSubtotal")}
              <input
                value={previewSub}
                onChange={(e) => setPreviewSub(e.target.value)}
                className="mt-1 block w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              {t("previewPin")}
              <input
                value={previewPin}
                onChange={(e) => setPreviewPin(e.target.value)}
                className="mt-1 block w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="flex items-center gap-2 pt-5 text-xs font-bold">
              <input
                type="checkbox"
                checked={previewCod}
                onChange={(e) => setPreviewCod(e.target.checked)}
              />
              COD
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {t("previewDelivery")}: ₹{quote.deliveryFee.toLocaleString("en-IN")} ·{" "}
            {t("previewCodFee")}: ₹{quote.codHandling.toLocaleString("en-IN")} ·{" "}
            {quote.freeShippingApplied ? t("previewFreeShip") : t("previewPaidShip")}
            {quote.matchedRuleLabel
              ? ` · ${quote.matchedRuleLabel}`
              : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100">
            {t("taxShipping")}
          </h3>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("gstPercent")}
            <input
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("shipMetro")}
            <input
              value={shipMetro}
              onChange={(e) => setShipMetro(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("shipRest")}
            <input
              value={shipRest}
              onChange={(e) => setShipRest(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
          </label>
          <p className="mt-2 text-xs text-slate-400">{t("taxShippingNote")}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
            onClick={() => {
              saveTaxShippingConfig({
                taxPercent: Math.min(99, Math.max(0, Number(tax) || 0)),
                metroFlat: Math.max(0, Number(shipMetro) || 0),
                restFlat: Math.max(0, Number(shipRest) || 0),
              });
            }}
          >
            {t("saveRules")}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <Lock className="h-5 w-5 text-[#0066ff]" />
            {t("accessTitle")}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t("accessHint")}</p>
          <label className="mt-3 block text-xs font-bold text-slate-500">
            {t("accessCurrent")}
            <div className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950">
              {user?.accessScope ?? "none"}
            </div>
          </label>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
              <span>{t("accessOperations")}</span>
              <span className="font-mono text-xs text-emerald-600">
                {t("permOrdersHint")}
              </span>
            </li>
            <li className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
              <span>{t("accessCatalog")}</span>
              <span className="font-mono text-xs text-emerald-600">
                {t("permCatalogHint")}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
            <ScrollText className="h-5 w-5 text-slate-600" />
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
        <p className="mt-1 text-xs text-slate-500">{t("activityLogsHint")}</p>
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
          {logs.length === 0 ? (
            <li className="text-slate-400">{t("activityEmpty")}</li>
          ) : (
            logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-0.5 border-b border-slate-100 py-2 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-xs text-[#0066ff]">
                    {log.actor}
                  </span>
                  <time
                    className="text-xs text-slate-400"
                    dateTime={log.at}
                  >
                    {new Date(log.at).toLocaleString()}
                  </time>
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {log.action}
                </span>
                {log.detail ? (
                  <span className="text-xs text-slate-500">{log.detail}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
