"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import type { InventoryVariant } from "@/lib/inventory-model";

export function AdminInventory() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"stock" | "po" | "transfer" | "returns" | "analytics" | "audit">("stock");
  const products = useCatalogProducts();
  const [rows, setRows] = useState<InventoryVariant[]>([]);
  const [analytics, setAnalytics] = useState<{ variants: number; lowStock: number; totalOnHand: number; reserved: number; quarantine: number } | null>(null);
  const [movements, setMovements] = useState<
    {
      movementId: string;
      variantId: string;
      productId: string;
      type: string;
      qty: number;
      refType?: string;
      refId?: string;
      actorUid?: string;
      note?: string;
      at: number;
    }[]
  >([]);
  const [alerts, setAlerts] = useState<
    {
      alertId: string;
      variantId: string;
      title: string;
      available: number;
      reorderLevel: number;
      severity: "warning" | "critical" | "out";
      status: "open" | "resolved";
      updatedAt: number;
    }[]
  >([]);
  const [snapshots, setSnapshots] = useState<
    {
      snapshotId: string;
      date: string;
      totals: {
        variants: number;
        lowStock: number;
        totalOnHand: number;
        reserved: number;
        quarantine: number;
      };
      updatedAt: number;
    }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState("1");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [note, setNote] = useState("");
  const [poVariantId, setPoVariantId] = useState("");
  const [poQty, setPoQty] = useState("1");
  const [poCost, setPoCost] = useState("0");
  const [poReceiveId, setPoReceiveId] = useState("");
  const [fromWh, setFromWh] = useState("main");
  const [toWh, setToWh] = useState("secondary");
  const [trVariantId, setTrVariantId] = useState("");
  const [trQty, setTrQty] = useState("1");
  const [trReceiveId, setTrReceiveId] = useState("");
  const [retOrderId, setRetOrderId] = useState("");
  const [retVariantId, setRetVariantId] = useState("");
  const [retQty, setRetQty] = useState("1");
  const [retKind, setRetKind] = useState<"return" | "rto">("return");
  const [retDisposition, setRetDisposition] = useState<"sellable" | "damaged">("sellable");
  const [retNote, setRetNote] = useState("");

  function escapeCsvCell(v: string | number): string {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function downloadDailyReconciliationCsv() {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    const lines: string[] = [];
    lines.push("Daily Stock Reconciliation Report");
    lines.push(`Generated At,${escapeCsvCell(now.toISOString())}`);
    lines.push("");
    lines.push("Inventory Snapshot");
    lines.push(
      [
        "Variant ID",
        "Product ID",
        "Title",
        "On Hand",
        "Quarantine",
        "Reserved",
        "Available",
        "Reorder Level",
        "Action",
      ].join(",")
    );
    for (const r of rows) {
      const available = Math.max(0, r.onHand - r.reserved);
      const action = available <= r.reorderLevel ? "RESTOCK_NOW" : "OK";
      lines.push(
        [
          escapeCsvCell(r.variantId),
          escapeCsvCell(r.productId),
          escapeCsvCell(r.title || ""),
          escapeCsvCell(r.onHand),
          escapeCsvCell(Math.max(0, Number(r.quarantineQty ?? 0))),
          escapeCsvCell(r.reserved),
          escapeCsvCell(available),
          escapeCsvCell(r.reorderLevel),
          escapeCsvCell(action),
        ].join(",")
      );
    }
    lines.push("");
    lines.push("Low Stock Action List");
    lines.push(
      ["Variant ID", "Title", "Available", "Reorder Level", "Suggested Action"].join(",")
    );
    const lowRows = rows.filter(
      (r) => Math.max(0, r.onHand - r.reserved) <= r.reorderLevel
    );
    for (const r of lowRows) {
      const available = Math.max(0, r.onHand - r.reserved);
      lines.push(
        [
          escapeCsvCell(r.variantId),
          escapeCsvCell(r.title || r.productId),
          escapeCsvCell(available),
          escapeCsvCell(r.reorderLevel),
          escapeCsvCell("Create Restock Slip"),
        ].join(",")
      );
    }
    if (lowRows.length === 0) {
      lines.push(["-", "-", "-", "-", "No immediate action"].join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-reconciliation-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg("Daily reconciliation CSV exported.");
  }

  function downloadSnapshotHistoryCsv() {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const lines: string[] = [];
    lines.push("Inventory Snapshot History");
    lines.push("Date,Variants,LowStock,OnHand,Reserved,Quarantine,UpdatedAt");
    for (const s of snapshots) {
      lines.push(
        [
          escapeCsvCell(s.date),
          escapeCsvCell(s.totals.variants),
          escapeCsvCell(s.totals.lowStock),
          escapeCsvCell(s.totals.totalOnHand),
          escapeCsvCell(s.totals.reserved),
          escapeCsvCell(s.totals.quarantine),
          escapeCsvCell(s.updatedAt ? new Date(s.updatedAt).toISOString() : ""),
        ].join(",")
      );
    }
    if (snapshots.length === 0) lines.push("-,-,-,-,-,-,-");
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-snapshot-history-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg("Snapshot history CSV exported.");
  }

  function downloadMovementLedgerCsv() {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    const lines: string[] = [];
    lines.push("Movement Ledger Report (Today)");
    lines.push(`Generated At,${escapeCsvCell(now.toISOString())}`);
    lines.push("");
    lines.push(
      [
        "Movement ID",
        "At (ISO)",
        "Type",
        "Variant ID",
        "Product ID",
        "Qty",
        "Ref Type",
        "Ref ID",
        "Actor UID",
        "Note",
      ].join(",")
    );
    for (const m of movements) {
      lines.push(
        [
          escapeCsvCell(m.movementId),
          escapeCsvCell(m.at ? new Date(m.at).toISOString() : ""),
          escapeCsvCell(m.type),
          escapeCsvCell(m.variantId),
          escapeCsvCell(m.productId),
          escapeCsvCell(m.qty),
          escapeCsvCell(m.refType ?? ""),
          escapeCsvCell(m.refId ?? ""),
          escapeCsvCell(m.actorUid ?? ""),
          escapeCsvCell(m.note ?? ""),
        ].join(",")
      );
    }
    if (movements.length === 0) {
      lines.push(["-", "-", "-", "-", "-", "-", "-", "-", "-", "No movement today"].join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-movement-ledger-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg("Movement ledger CSV exported.");
  }

  async function load() {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    if (!token) {
      setMsg("Sign in required.");
      return;
    }
    const res = await fetch("/api/admin/inventory", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const j = (await res.json().catch(() => ({}))) as {
      rows?: InventoryVariant[];
      analytics?: { variants: number; lowStock: number; totalOnHand: number; reserved: number; quarantine: number };
      movements?: {
        movementId: string;
        variantId: string;
        productId: string;
        type: string;
        qty: number;
        refType?: string;
        refId?: string;
        actorUid?: string;
        note?: string;
        at: number;
      }[];
      alerts?: {
        alertId: string;
        variantId: string;
        title: string;
        available: number;
        reorderLevel: number;
        severity: "warning" | "critical" | "out";
        status: "open" | "resolved";
        updatedAt: number;
      }[];
      snapshots?: {
        snapshotId: string;
        date: string;
        totals: {
          variants: number;
          lowStock: number;
          totalOnHand: number;
          reserved: number;
          quarantine: number;
        };
        updatedAt: number;
      }[];
      error?: string;
    };
    if (!res.ok) {
      setMsg(j.error ?? "Could not load inventory.");
      return;
    }
    setRows(Array.isArray(j.rows) ? j.rows : []);
    setAnalytics(j.analytics ?? null);
    setMovements(Array.isArray(j.movements) ? j.movements : []);
    setAlerts(Array.isArray(j.alerts) ? j.alerts : []);
    setSnapshots(Array.isArray(j.snapshots) ? j.snapshots : []);
  }

  useEffect(() => {
    void load();
  }, []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  async function submitAdjust() {
    if (!variantId.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken();
      if (!token) {
        setMsg("Sign in required.");
        return;
      }
      const p = productMap.get(variantId.trim());
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "adjust",
          variantId: variantId.trim(),
          productId: p?.id ?? variantId.trim(),
          sku: p?.slug ?? variantId.trim(),
          title: p?.title ?? variantId.trim(),
          qty: Number(qty),
          direction,
          note: note.trim() || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.error ?? "Adjustment failed.");
        return;
      }
      setMsg("Inventory updated.");
      setNote("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    if (!token) {
      setMsg("Sign in required.");
      return false;
    }
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; poId?: string; transferId?: string };
    if (!res.ok || !j.ok) {
      setMsg(j.error ?? "Action failed.");
      return false;
    }
    if (j.poId) setMsg(`Restock slip created: ${j.poId}`);
    if (j.transferId) setMsg(`Transfer created: ${j.transferId}`);
    return true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("navInventory")}
        </h2>
        <p className="text-sm text-slate-500">
          Live stock ledger with manual adjustments and low-stock visibility.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["stock", "Stock"],
          ["po", "Restock Slip"],
          ["transfer", "Transfers"],
          ["returns", "Returns/RTO"],
          ["analytics", "Analytics"],
          ["audit", "Activity/Audit"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as typeof tab)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold ${tab === id ? "bg-[#0066ff] text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stock" ? <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick stock adjustment</p>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <input
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            placeholder="Variant / Product ID"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Qty"
            type="number"
            min={1}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value === "out" ? "out" : "in")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          >
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitAdjust()}
            className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
          >
            Apply
          </button>
        </div>
        {msg ? <p className="mt-2 text-xs text-slate-500">{msg}</p> : null}
      </div> : null}

      {tab === "stock" ? <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Inventory overview</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2">Variant</th>
                <th className="py-2">Product</th>
                <th className="py-2">On hand</th>
                <th className="py-2">Reserved</th>
                <th className="py-2">Available</th>
                <th className="py-2">Reorder level</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const available = Math.max(0, r.onHand - r.reserved);
                const low = available <= r.reorderLevel;
                return (
                  <tr key={r.variantId} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-mono text-xs">{r.variantId}</td>
                    <td className="py-2">{r.title || r.productId}</td>
                    <td className="py-2">{r.onHand}</td>
                    <td className="py-2">{r.reserved}</td>
                    <td className={`py-2 font-bold ${low ? "text-rose-600" : ""}`}>{available}</td>
                    <td className="py-2">{r.reorderLevel}</td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td className="py-8 text-slate-500" colSpan={6}>
                    No inventory records yet. Add stock from quick adjustment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div> : null}

      {tab === "po" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 space-y-3">
          <p className="text-sm font-bold">Restock Slip & Stock Receive</p>
          <div className="grid gap-3 md:grid-cols-4">
            <input value={poVariantId} onChange={(e) => setPoVariantId(e.target.value)} placeholder="variant-id" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <input value={poQty} onChange={(e) => setPoQty(e.target.value)} type="number" min={1} placeholder="qty" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <input value={poCost} onChange={(e) => setPoCost(e.target.value)} type="number" min={0} placeholder="cost ₹" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <button type="button" disabled={busy} onClick={async () => {
              setBusy(true);
              try {
                const ok = await postAction({
                  action: "po_create",
                  lines: [{ variantId: poVariantId.trim(), productId: poVariantId.trim(), qty: Number(poQty), costRupees: Number(poCost) }],
                });
                if (ok) await load();
              } finally { setBusy(false); }
            }} className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Create Restock Slip</button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input value={poReceiveId} onChange={(e) => setPoReceiveId(e.target.value)} placeholder="restock-slip-id to receive" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <button type="button" disabled={busy} onClick={async () => {
              setBusy(true);
              try {
                const ok = await postAction({ action: "po_receive", poId: poReceiveId.trim() });
                if (ok) { setMsg("Stock received."); await load(); }
              } finally { setBusy(false); }
            }} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Stock Receive</button>
          </div>
        </div>
      ) : null}

      {tab === "transfer" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 space-y-3">
          <p className="text-sm font-bold">Internal transfer (own delivery hubs)</p>
          <div className="grid gap-3 md:grid-cols-5">
            <input value={fromWh} onChange={(e) => setFromWh(e.target.value)} placeholder="from warehouse" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <input value={toWh} onChange={(e) => setToWh(e.target.value)} placeholder="to warehouse" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <input value={trVariantId} onChange={(e) => setTrVariantId(e.target.value)} placeholder="variant-id" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <input value={trQty} onChange={(e) => setTrQty(e.target.value)} type="number" min={1} placeholder="qty" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <button type="button" disabled={busy} onClick={async () => {
              setBusy(true);
              try {
                const ok = await postAction({
                  action: "transfer_create",
                  fromWarehouseId: fromWh.trim(),
                  toWarehouseId: toWh.trim(),
                  lines: [{ variantId: trVariantId.trim(), productId: trVariantId.trim(), qty: Number(trQty) }],
                });
                if (ok) await load();
              } finally { setBusy(false); }
            }} className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Create transfer</button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input value={trReceiveId} onChange={(e) => setTrReceiveId(e.target.value)} placeholder="transfer-id to receive" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <button type="button" disabled={busy} onClick={async () => {
              setBusy(true);
              try {
                const ok = await postAction({ action: "transfer_receive", transferId: trReceiveId.trim() });
                if (ok) { setMsg("Transfer received."); await load(); }
              } finally { setBusy(false); }
            }} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Receive transfer</button>
          </div>
        </div>
      ) : null}

      {tab === "returns" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 space-y-3">
          <p className="text-sm font-bold">Return/RTO intake</p>
          <div className="grid gap-3 md:grid-cols-6">
            <input
              value={retOrderId}
              onChange={(e) => setRetOrderId(e.target.value)}
              placeholder="order-id"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <input
              value={retVariantId}
              onChange={(e) => setRetVariantId(e.target.value)}
              placeholder="variant-id"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <input
              value={retQty}
              onChange={(e) => setRetQty(e.target.value)}
              type="number"
              min={1}
              placeholder="qty"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <select
              value={retKind}
              onChange={(e) => setRetKind(e.target.value === "rto" ? "rto" : "return")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="return">Customer Return</option>
              <option value="rto">RTO</option>
            </select>
            <select
              value={retDisposition}
              onChange={(e) =>
                setRetDisposition(e.target.value === "damaged" ? "damaged" : "sellable")
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="sellable">Sellable</option>
              <option value="damaged">Damaged (Quarantine)</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const token = await getFirebaseAuth()?.currentUser?.getIdToken();
                  if (!token) {
                    setMsg("Sign in required.");
                    return;
                  }
                  const res = await fetch("/api/inventory/return", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      orderId: retOrderId.trim(),
                      kind: retKind,
                      disposition: retDisposition,
                      note: retNote.trim() || undefined,
                      lines: [
                        {
                          variantId: retVariantId.trim(),
                          productId: retVariantId.trim(),
                          qty: Number(retQty),
                        },
                      ],
                    }),
                  });
                  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
                  if (!res.ok || !j.ok) {
                    setMsg(j.error ?? "Return intake failed.");
                    return;
                  }
                  setMsg(
                    retDisposition === "damaged"
                      ? "Return received to quarantine."
                      : "Return received to sellable stock."
                  );
                  await load();
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
            >
              Receive return
            </button>
          </div>
          <input
            value={retNote}
            onChange={(e) => setRetNote(e.target.value)}
            placeholder="note (optional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
        </div>
      ) : null}

      {tab === "analytics" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-bold">Inventory analytics snapshot</p>
          {analytics ? (
            <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">Variants: <b>{analytics.variants}</b></div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">Low stock: <b>{analytics.lowStock}</b></div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">On hand: <b>{analytics.totalOnHand}</b></div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">Reserved: <b>{analytics.reserved}</b></div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">Quarantine: <b>{analytics.quarantine}</b></div>
            </div>
          ) : <p className="mt-2 text-sm text-slate-500">No analytics yet.</p>}
          <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-bold">Low stock alerts</p>
            <div className="mt-2 space-y-1 text-sm">
              {alerts.filter((a) => a.status === "open").slice(0, 12).map((a) => (
                <p key={a.alertId}>
                  <span className="font-mono text-xs">{a.variantId}</span> - {a.title} (available {a.available}, reorder {a.reorderLevel})
                </p>
              ))}
              {alerts.filter((a) => a.status === "open").length === 0 ? (
                <p className="text-slate-500">No open low-stock alert.</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const ok = await postAction({
                    action: "alerts_refresh",
                    notifyWebhook: true,
                  });
                  if (ok) {
                    setMsg("Low-stock alerts refreshed (webhook optional).");
                    await load();
                  }
                } finally {
                  setBusy(false);
                }
              }}
              className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-600"
            >
              Refresh low-stock alerts
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-bold">Daily snapshot history</p>
            <div className="mt-2 max-h-44 overflow-y-auto text-sm">
              {snapshots.map((s) => (
                <p key={s.snapshotId}>
                  {s.date}: onHand {s.totals.totalOnHand}, lowStock {s.totals.lowStock}, quarantine {s.totals.quarantine}
                </p>
              ))}
              {snapshots.length === 0 ? <p className="text-slate-500">No snapshots yet.</p> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const ok = await postAction({ action: "snapshot_create" });
                    if (ok) {
                      setMsg("Daily snapshot saved.");
                      await load();
                    }
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-600"
              >
                Save daily snapshot
              </button>
              <button
                type="button"
                onClick={downloadSnapshotHistoryCsv}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white dark:bg-slate-700"
              >
                Export snapshot history CSV
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadDailyReconciliationCsv}
            className="mt-4 rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
          >
            Export daily reconciliation CSV
          </button>
          <button
            type="button"
            onClick={downloadMovementLedgerCsv}
            className="ml-2 mt-4 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white dark:bg-slate-700"
          >
            Export movement ledger CSV
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const ok = await postAction({ action: "cleanup_expired" });
                if (ok) {
                  setMsg("Expired reservations released.");
                  await load();
                }
              } finally {
                setBusy(false);
              }
            }}
            className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-600"
          >
            Release expired reservations
          </button>
        </div>
      ) : null}

      {tab === "audit" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-bold">Activity / audit trail</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2">Time</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Variant</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Ref</th>
                  <th className="py-2">Actor</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.movementId} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-xs">{m.at ? new Date(m.at).toLocaleString() : "-"}</td>
                    <td className="py-2">{m.type}</td>
                    <td className="py-2 font-mono text-xs">{m.variantId}</td>
                    <td className="py-2">{m.qty}</td>
                    <td className="py-2 text-xs">{m.refType ?? "-"} {m.refId ?? ""}</td>
                    <td className="py-2 text-xs">{m.actorUid ?? "-"}</td>
                    <td className="py-2 text-xs">{m.note ?? "-"}</td>
                  </tr>
                ))}
                {movements.length === 0 ? (
                  <tr>
                    <td className="py-8 text-slate-500" colSpan={7}>No activity yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
