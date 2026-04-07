"use client";

import { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTaxPercent } from "@/lib/admin-security-storage";
import {
  buildInvoiceHtmlDocument,
  escapeHtml,
  getInvoiceHsn,
  getSellerDisplayName,
  getSellerStreetAddress,
  linesFromInclusiveTotal,
  openPrintableHtml,
} from "@/lib/invoice-document";

type Props = {
  orderId: string;
  customer: string;
  amount: number;
  paymentMethod?: string;
  showCodQr?: boolean;
  /** Shown on invoice header */
  placedAt?: string;
  phone?: string;
  paymentRef?: string;
};

export function InvoicePrintButton({
  orderId,
  customer,
  amount,
  paymentMethod = "UPI",
  showCodQr = false,
  placedAt,
  phone,
  paymentRef,
}: Props) {
  const t = useTranslations("admin");
  const [gstPct, setGstPct] = useState(18);

  useEffect(() => {
    const sync = () => setGstPct(getTaxPercent());
    sync();
    window.addEventListener("lc-admin-settings", sync);
    return () => window.removeEventListener("lc-admin-settings", sync);
  }, []);

  function printInvoice() {
    const dateStr =
      placedAt?.trim() ||
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    const lines = linesFromInclusiveTotal(
      `Merchandise & fulfilment — order ${orderId}`,
      1,
      amount,
      gstPct,
      getInvoiceHsn()
    );
    const html = buildInvoiceHtmlDocument({
      invoiceNo: orderId,
      invoiceDate: dateStr,
      placeOfSupply: "West Bengal",
      buyerName: customer,
      buyerPhone: phone,
      lines,
      grandTotal: amount,
      gstPercent: gstPct,
      paymentMethod,
      paymentRef,
      showCodQr,
      qrAmount: amount,
    });
    openPrintableHtml(html);
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
  const brand = getSellerDisplayName();
  const addr = getSellerStreetAddress();

  function printLabel() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Label ${orderId}</title>
    <style>
      @media print { body { margin: 0 } }
      body { font-family: system-ui, sans-serif; padding: 16px; width: 4in; min-height: 6in; border: 2px dashed #334155; box-sizing: border-box }
      .h { font-size: 14px; font-weight: 800; color: #0066ff; margin: 0 0 12px }
      .from { font-size: 9px; color: #64748b; margin: 0 0 12px; line-height: 1.4 }
      .row { font-size: 13px; margin: 6px 0 }
      .mono { font-family: ui-monospace, monospace; font-weight: 700 }
    </style></head><body>
    <p class="h">${escapeHtml(brand)} — Ship</p>
    <p class="from">From: ${escapeHtml(addr)}</p>
    <p class="row"><strong>To:</strong> ${escapeHtml(customer)}</p>
    <p class="row"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p class="row mono">ORDER ${escapeHtml(orderId)}</p>
    <p style="margin-top:24px;font-size:11px;color:#64748b">Affix on package</p>
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
