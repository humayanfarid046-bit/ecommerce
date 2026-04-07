"use client";

import { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTaxPercent } from "@/lib/admin-security-storage";
const BRAND_ADDRESS =
  "Libas Collection · 12 Park Street, Kolkata 700016 · West Bengal, India";
const SOCIAL = "Instagram @libascollection · support@libas.demo";

type Props = {
  orderId: string;
  customer: string;
  amount: number;
  paymentMethod?: string;
  showCodQr?: boolean;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function InvoicePrintButton({
  orderId,
  customer,
  amount,
  paymentMethod = "UPI",
  showCodQr = false,
}: Props) {
  const t = useTranslations("admin");
  const [gstPct, setGstPct] = useState(18);

  useEffect(() => {
    const sync = () => setGstPct(getTaxPercent());
    sync();
    window.addEventListener("lc-admin-settings", sync);
    return () => window.removeEventListener("lc-admin-settings", sync);
  }, []);

  const taxable = amount / (1 + gstPct / 100);
  const gst = amount - taxable;
  const qrData = `upi://pay?pa=demo@libas&pn=Libas&am=${amount.toFixed(2)}&cu=INR&tn=Invoice ${orderId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;

  function printInvoice() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${escapeHtml(orderId)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:32px;max-width:720px;margin:0 auto;color:#0f172a}
      .brand{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:2px solid #0066ff;padding-bottom:16px;margin-bottom:20px}
      .logo{font-size:22px;font-weight:800;color:#0066ff;margin:0}
      .addr{font-size:11px;color:#64748b;line-height:1.5;max-width:280px}
      .social{font-size:10px;color:#94a3b8;margin-top:8px}
      h1{font-size:18px;margin:0 0 8px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}
      th{background:#f8fafc}
      .muted{color:#64748b;font-size:12px}
      .tot{font-weight:700}
      .qr{display:flex;gap:20px;align-items:flex-start;margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px}
      .qr img{width:140px;height:140px}
    </style></head><body>
    <div class="brand">
      <div>
        <p class="logo">Libas Collection</p>
        <p class="addr">${escapeHtml(BRAND_ADDRESS)}</p>
        <p class="social">${escapeHtml(SOCIAL)}</p>
      </div>
      <div style="text-align:right;font-size:12px">
        <strong>Tax invoice</strong><br/><span class="muted">GSTIN: 19AABCL1234F1Z5 (demo)</span>
      </div>
    </div>
    <h1>Invoice</h1>
    <p><strong>Order:</strong> ${escapeHtml(orderId)}</p>
    <p><strong>Bill to:</strong> ${escapeHtml(customer)}</p>
    <p><strong>Payment:</strong> ${escapeHtml(paymentMethod)}</p>
    <table>
      <tr><th>Description</th><th>Taxable</th><th>GST (${gstPct}%)</th><th>Total</th></tr>
      <tr>
        <td>Merchandise & fulfilment</td>
        <td>₹${Math.round(taxable).toLocaleString("en-IN")}</td>
        <td>₹${Math.round(gst).toLocaleString("en-IN")}</td>
        <td class="tot">₹${amount.toLocaleString("en-IN")}</td>
      </tr>
    </table>
    <p class="muted" style="margin-top:16px">Amount in words (demo): Rupees ${amount} only.</p>
    ${showCodQr ? `<div class="qr"><div><img src="${qrSrc}" alt="Pay"/><p class="muted" style="margin:8px 0 0;font-size:11px">Scan to pay via UPI (COD settlement / optional)</p></div><div><p style="font-size:13px;font-weight:700">Quick pay</p><p class="muted" style="font-size:12px">Customer can scan and complete payment before delivery.</p></div></div>` : ""}
    <p class="muted" style="margin-top:24px">Print → Save as PDF from your browser.</p>
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <button
      type="button"
      onClick={printInvoice}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <FileText className="h-3.5 w-3.5" />
      {t("invoicePdf")}
    </button>
  );
}

export function ShippingLabelButton({
  orderId,
  customer,
  phone,
}: {
  orderId: string;
  customer: string;
  phone: string;
}) {
  const t = useTranslations("admin");

  function printLabel() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Label ${orderId}</title>
    <style>
      @media print { body { margin: 0 } }
      body { font-family: system-ui, sans-serif; padding: 16px; width: 4in; min-height: 6in; border: 2px dashed #334155; box-sizing: border-box }
      .h { font-size: 14px; font-weight: 800; color: #0066ff; margin: 0 0 12px }
      .row { font-size: 13px; margin: 6px 0 }
      .mono { font-family: ui-monospace, monospace; font-weight: 700 }
    </style></head><body>
    <p class="h">Libas Collection — Ship</p>
    <p class="row"><strong>To:</strong> ${escapeHtml(customer)}</p>
    <p class="row"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p class="row mono">ORDER ${escapeHtml(orderId)}</p>
    <p style="margin-top:24px;font-size:11px;color:#64748b">Affix on package — demo label</p>
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <button
      type="button"
      onClick={printLabel}
      className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
    >
      <Printer className="h-3 w-3" />
      {t("shippingLabel")}
    </button>
  );
}
