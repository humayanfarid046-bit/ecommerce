/**
 * Print / Save-as-PDF tax invoice HTML (browser). Seller details override via NEXT_PUBLIC_* in .env.local.
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (TENS[t] ?? "") + (o ? " " + (ONES[o] ?? "") : "");
}

function belowThousand(n: number): string {
  if (n < 100) return belowHundred(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (ONES[h] ?? "") + " Hundred" + (r ? " " + belowHundred(r) : "");
}

/** Integer rupees → English words (Indian grouping). */
export function rupeesToWords(n: number): string {
  const v = Math.floor(Math.abs(n));
  if (v === 0) return "Zero";
  if (v > 99999999) {
    return `${v.toLocaleString("en-IN")} (see figures)`;
  }
  const parts: string[] = [];
  let rem = v;
  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  if (crore) parts.push(belowHundred(crore) + " Crore");
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  if (lakh) parts.push(belowHundred(lakh) + " Lakh");
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousand) parts.push(belowThousand(thousand) + " Thousand");
  if (rem) parts.push(belowThousand(rem));
  return parts.filter(Boolean).join(" ");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getSellerDisplayName(): string {
  return (
    process.env.NEXT_PUBLIC_INVOICE_SELLER_NAME?.trim() ||
    "AJH Libas Collection"
  );
}

export function getSellerStreetAddress(): string {
  return (
    process.env.NEXT_PUBLIC_INVOICE_ADDRESS?.trim() ||
    "National Bazar, Raninagar, Murshidabad, West Bengal — 742308, India"
  );
}

function sellerName(): string {
  return getSellerDisplayName();
}

function sellerAddress(): string {
  return getSellerStreetAddress();
}

function sellerGstin(): string {
  const g = process.env.NEXT_PUBLIC_INVOICE_GSTIN?.trim();
  return g && g.length > 0 ? g : "— (set NEXT_PUBLIC_INVOICE_GSTIN)";
}

function sellerEmail(): string {
  return process.env.NEXT_PUBLIC_INVOICE_EMAIL?.trim() || "support@example.com";
}

function sellerPhone(): string {
  return process.env.NEXT_PUBLIC_INVOICE_PHONE?.trim() || "";
}

export function getInvoiceHsn(): string {
  return process.env.NEXT_PUBLIC_INVOICE_HSN?.trim() || "6204";
}

export type InvoiceLineInput = {
  description: string;
  hsn: string;
  qty: number;
  taxable: number;
  cgst: number;
  sgst: number;
  lineTotal: number;
};

export type BuildInvoiceHtmlInput = {
  invoiceNo: string;
  invoiceDate: string;
  placeOfSupply: string;
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  lines: InvoiceLineInput[];
  grandTotal: number;
  gstPercent: number;
  paymentMethod: string;
  paymentRef?: string;
  /** Optional UPI QR for COD follow-up */
  showCodQr?: boolean;
  qrAmount?: number;
};

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function invoiceCss(): string {
  return `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    color: #0f172a;
    font-size: 11px;
    line-height: 1.45;
    margin: 0;
    padding: 0;
  }
  .sheet { max-width: 720px; margin: 0 auto; }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    border-bottom: 3px solid #0066ff;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }
  .brand { font-size: 20px; font-weight: 800; color: #0066ff; margin: 0 0 4px; letter-spacing: -0.02em; }
  .addr { color: #475569; font-size: 10.5px; max-width: 320px; margin: 0; }
  .badge {
    text-align: right;
    font-size: 11px;
  }
  .badge strong { font-size: 13px; display: block; margin-bottom: 4px; }
  .gst { color: #64748b; font-size: 10px; }
  h1 {
    font-size: 15px;
    margin: 0 0 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #334155;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .box {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    background: #fafafa;
  }
  .box h2 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
  .box p { margin: 2px 0; font-size: 11px; }
  table.inv {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }
  table.inv th {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 6px 5px;
    text-align: left;
    font-weight: 700;
    color: #334155;
  }
  table.inv td {
    border: 1px solid #e2e8f0;
    padding: 7px 5px;
    vertical-align: top;
  }
  table.inv .num { text-align: right; font-variant-numeric: tabular-nums; }
  table.inv .tot { font-weight: 700; }
  .sum {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }
  .sum-inner {
    width: 280px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .sum-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 11px;
  }
  .sum-row:last-child { border-bottom: 0; background: #eff6ff; font-weight: 800; font-size: 12px; }
  .muted { color: #64748b; }
  .small { font-size: 10px; }
  .words {
    margin-top: 12px;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px dashed #cbd5e1;
    font-size: 10.5px;
  }
  .foot {
    margin-top: 18px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    font-size: 10px;
    color: #64748b;
  }
  .sign { text-align: right; }
  .sign .line { margin-top: 36px; border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: 600; color: #334155; }
  .qr { display: flex; gap: 14px; align-items: flex-start; margin-top: 14px; padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
  .qr-title { font-weight: 700; margin: 0 0 4px; font-size: 12px; color: #0f172a; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .bulk-wrap { break-inside: avoid; }
`;
}

/** Inner &lt;div class="sheet"&gt;… for one invoice (reuse for bulk print). */
export function buildInvoiceSheetHtml(input: BuildInvoiceHtmlInput): string {
  const {
    invoiceNo,
    invoiceDate,
    placeOfSupply,
    buyerName,
    buyerPhone,
    buyerAddress,
    lines,
    grandTotal,
    gstPercent,
    paymentMethod,
    paymentRef,
    showCodQr,
    qrAmount,
  } = input;

  const words = rupeesToWords(Math.round(grandTotal));
  const qrData = `upi://pay?pa=${encodeURIComponent(
    process.env.NEXT_PUBLIC_INVOICE_UPI_VPA?.trim() || "merchant@upi"
  )}&pn=${encodeURIComponent(sellerName())}&am=${(qrAmount ?? grandTotal).toFixed(2)}&cu=INR&tn=Invoice ${invoiceNo}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=132x132&data=${encodeURIComponent(qrData)}`;

  const rows = lines
    .map(
      (L) => `<tr>
      <td>${escapeHtml(L.description)}</td>
      <td class="num">${escapeHtml(L.hsn)}</td>
      <td class="num">${L.qty}</td>
      <td class="num">${formatInr(L.taxable)}</td>
      <td class="num">${gstPercent}%</td>
      <td class="num">${formatInr(L.cgst)}</td>
      <td class="num">${formatInr(L.sgst)}</td>
      <td class="num tot">${formatInr(L.lineTotal)}</td>
    </tr>`
    )
    .join("");

  const codQrBlock =
    showCodQr && grandTotal > 0
      ? `<div class="qr">
      <img src="${qrSrc}" width="132" height="132" alt="UPI QR" />
      <div>
        <p class="qr-title">UPI — quick pay</p>
        <p class="muted small">Optional: scan to pay balance / COD settlement. VPA: ${escapeHtml(
          process.env.NEXT_PUBLIC_INVOICE_UPI_VPA?.trim() || "set NEXT_PUBLIC_INVOICE_UPI_VPA"
        )}</p>
      </div>
    </div>`
      : "";

  const phoneLine = sellerPhone()
    ? `<p class="muted small">Phone: ${escapeHtml(sellerPhone())}</p>`
    : "";

  return `<div class="sheet">
  <div class="top">
    <div>
      <p class="brand">${escapeHtml(sellerName())}</p>
      <p class="addr">${escapeHtml(sellerAddress())}</p>
      <p class="muted small">Email: ${escapeHtml(sellerEmail())}</p>
      ${phoneLine}
    </div>
    <div class="badge">
      <strong>Tax invoice</strong>
      <span class="gst">GSTIN: ${escapeHtml(sellerGstin())}</span>
    </div>
  </div>

  <h1>Invoice details</h1>
  <div class="grid2">
    <div class="box">
      <h2>Invoice</h2>
      <p><strong>No.</strong> ${escapeHtml(invoiceNo)}</p>
      <p><strong>Date</strong> ${escapeHtml(invoiceDate)}</p>
      <p><strong>Place of supply</strong> ${escapeHtml(placeOfSupply)}</p>
    </div>
    <div class="box">
      <h2>Bill to</h2>
      <p><strong>${escapeHtml(buyerName)}</strong></p>
      ${buyerPhone ? `<p>${escapeHtml(buyerPhone)}</p>` : ""}
      ${buyerAddress ? `<p class="muted">${escapeHtml(buyerAddress)}</p>` : ""}
    </div>
  </div>

  <p style="margin:0 0 8px;font-size:10px"><strong>Payment:</strong> ${escapeHtml(paymentMethod)}${paymentRef ? ` · Ref: ${escapeHtml(paymentRef)}` : ""}</p>

  <table class="inv" aria-label="Line items">
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">HSN</th>
        <th class="num">Qty</th>
        <th class="num">Taxable</th>
        <th class="num">GST%</th>
        <th class="num">CGST</th>
        <th class="num">SGST</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="sum">
    <div class="sum-inner">
      <div class="sum-row"><span>Grand total (incl. GST)</span><span>${formatInr(grandTotal)}</span></div>
    </div>
  </div>

  <div class="words">
    <strong>Amount in words (Indian rupees):</strong> ${escapeHtml(words)} only.
  </div>

  ${codQrBlock}

  <div class="foot">
    <div>
      <p class="muted small">This is a computer-generated invoice. For queries, contact ${escapeHtml(sellerEmail())}.</p>
      <p class="muted small">GST is charged as per applicable rates. Intra-state: CGST + SGST.</p>
    </div>
    <div class="sign">
      <div class="line">For ${escapeHtml(sellerName())}</div>
    </div>
  </div>
</div>`;
}

export function buildInvoiceHtmlDocument(input: BuildInvoiceHtmlInput): string {
  const inner = buildInvoiceSheetHtml(input);
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<title>Tax invoice ${escapeHtml(input.invoiceNo)}</title>
<style>${invoiceCss()}</style></head><body>${inner}</body></html>`;
}

/** Multiple invoices in one print dialog (page break between). */
export function buildBulkInvoiceHtmlDocument(
  inputs: BuildInvoiceHtmlInput[]
): string {
  if (inputs.length === 0) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Invoices</title></head><body><p>No invoices selected.</p></body></html>`;
  }
  const sheets = inputs
    .map((inp, i) => {
      const br =
        i < inputs.length - 1
          ? "page-break-after: always; break-after: page;"
          : "";
      return `<div class="bulk-wrap" style="${br}">${buildInvoiceSheetHtml(inp)}</div>`;
    })
    .join("");
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<title>Bulk invoices</title>
<style>${invoiceCss()}</style></head><body>${sheets}</body></html>`;
}

/** Single aggregate line from order total (GST inclusive). */
export function linesFromInclusiveTotal(
  title: string,
  qty: number,
  inclusiveTotal: number,
  gstPercent: number,
  hsn: string
): InvoiceLineInput[] {
  const total = Math.max(0, inclusiveTotal);
  const taxable = total / (1 + gstPercent / 100);
  const gst = total - taxable;
  const half = gst / 2;
  return [
    {
      description: title,
      hsn,
      qty,
      taxable,
      cgst: half,
      sgst: half,
      lineTotal: total,
    },
  ];
}

export function openPrintableHtml(html: string): void {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function buildOrderInvoiceForCustomer(opts: {
  orderId: string;
  placedDate: string;
  buyerName: string;
  buyerPhone?: string;
  itemTitle: string;
  totalRupees: number;
  paymentLabel: string;
  paymentRef?: string;
  shipCity?: string;
  gstPercent: number;
}): string {
  const hsn = getInvoiceHsn();
  const lines = linesFromInclusiveTotal(
    `${opts.itemTitle} — merchandise as per order ${opts.orderId}`,
    1,
    opts.totalRupees,
    opts.gstPercent,
    hsn
  );
  const addr = opts.shipCity
    ? `Ship / bill city: ${opts.shipCity} (address on file)`
    : undefined;
  return buildInvoiceHtmlDocument({
    invoiceNo: opts.orderId,
    invoiceDate: opts.placedDate,
    placeOfSupply: "West Bengal",
    buyerName: opts.buyerName,
    buyerPhone: opts.buyerPhone,
    buyerAddress: addr,
    lines,
    grandTotal: opts.totalRupees,
    gstPercent: opts.gstPercent,
    paymentMethod: opts.paymentLabel,
    paymentRef: opts.paymentRef,
    showCodQr: false,
  });
}
