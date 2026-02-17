import type { LineItem, BusinessSnapshot, ClientSnapshot } from "@/lib/db/schema";

type QuoteData = {
  type: "quote";
  documentNumber: string;
  date: string;
  validUntil: string;
  paymentTermsDays: number;
  businessSnapshot: BusinessSnapshot;
  clientSnapshot: ClientSnapshot;
  lineItems: LineItem[];
  subtotal: string;
  vatRate: string | null;
  vatAmount: string | null;
  total: string;
  notes: string | null;
  warrantyText: string | null;
  disclaimerText: string;
  additionalWorkClause: string;
  withdrawalNotice: string | null;
};

type InvoiceData = {
  type: "invoice";
  documentNumber: string;
  invoiceDate: string;
  serviceDate: string | null;
  dueDate: string;
  paymentTermsDays: number;
  businessSnapshot: BusinessSnapshot;
  clientSnapshot: ClientSnapshot;
  lineItems: LineItem[];
  subtotal: string;
  vatRate: string | null;
  vatAmount: string | null;
  total: string;
  notes: string | null;
};

type DocumentData = QuoteData | InvoiceData;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(v: string | number): string {
  const num = typeof v === "number" ? v : parseFloat(v);
  return `€${num.toLocaleString("et-EE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function generateDocumentHtml(data: DocumentData): string {
  const biz = data.businessSnapshot;
  const client = data.clientSnapshot;
  const accentColor = "#2563EB";

  const labor = data.lineItems.filter((i) => !i.isMaterial);
  const materials = data.lineItems.filter((i) => i.isMaterial);

  const isQuote = data.type === "quote";
  const title = isQuote ? "HINNAPAKKUMINE" : "ARVE";

  // Build line items rows
  let lineItemsHtml = "";
  let rowNum = 1;

  const renderRow = (item: LineItem, num: number) => `
    <tr>
      <td class="nr">${num}</td>
      <td>${escapeHtml(item.description)}</td>
      <td class="right">${item.quantity}</td>
      <td class="center">${escapeHtml(item.unit)}</td>
      <td class="right">${formatMoney(item.unitPrice)}</td>
      <td class="right bold">${formatMoney(item.total)}</td>
    </tr>`;

  const renderSectionHeader = (label: string) => `
    <tr class="section-header">
      <td colspan="6">${label}</td>
    </tr>`;

  if (labor.length > 0 && materials.length > 0) {
    lineItemsHtml += renderSectionHeader("Tööd");
    labor.forEach((item) => {
      lineItemsHtml += renderRow(item, rowNum++);
    });
    lineItemsHtml += renderSectionHeader("Materjalid");
    materials.forEach((item) => {
      lineItemsHtml += renderRow(item, rowNum++);
    });
  } else {
    data.lineItems.forEach((item) => {
      lineItemsHtml += renderRow(item, rowNum++);
    });
  }

  // Build totals
  let totalsHtml = `
    <div class="totals-row">
      <span>Vahesumma</span>
      <span>${formatMoney(data.subtotal)}</span>
    </div>`;

  if (data.vatRate && data.vatAmount) {
    totalsHtml += `
    <div class="totals-row">
      <span>KM ${parseFloat(data.vatRate)}%</span>
      <span>${formatMoney(data.vatAmount)}</span>
    </div>`;
  }

  totalsHtml += `
    <div class="totals-row grand-total">
      <span>KOKKU</span>
      <span>${formatMoney(data.total)}</span>
    </div>`;

  // Build metadata section
  let metaHtml = "";
  if (isQuote) {
    const q = data as QuoteData;
    metaHtml = `
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Kuupäev</span>
          <span class="meta-value">${formatDate(q.date)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Kehtiv kuni</span>
          <span class="meta-value">${formatDate(q.validUntil)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Maksetingimused</span>
          <span class="meta-value">${q.paymentTermsDays} päeva</span>
        </div>
      </div>`;
  } else {
    const inv = data as InvoiceData;
    metaHtml = `
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Arve kuupäev</span>
          <span class="meta-value">${formatDate(inv.invoiceDate)}</span>
        </div>
        ${inv.serviceDate ? `
        <div class="meta-item">
          <span class="meta-label">Teenuse kuupäev</span>
          <span class="meta-value">${formatDate(inv.serviceDate)}</span>
        </div>` : ""}
        <div class="meta-item">
          <span class="meta-label">Maksetähtaeg</span>
          <span class="meta-value">${formatDate(inv.dueDate)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Maksetingimused</span>
          <span class="meta-value">${inv.paymentTermsDays} päeva</span>
        </div>
      </div>`;
  }

  // Payment details (both quote and invoice)
  const paymentHtml = `
    <div class="payment-section">
      <h3>Makserekvisiidid</h3>
      <div class="payment-grid">
        <span class="payment-label">Saaja</span>
        <span>${escapeHtml(biz.companyName)}</span>
        <span class="payment-label">IBAN</span>
        <span class="mono">${escapeHtml(biz.iban)}</span>
        <span class="payment-label">Pank</span>
        <span>${escapeHtml(biz.bankName)}</span>
        <span class="payment-label">Selgitus</span>
        <span class="mono">${escapeHtml(data.documentNumber)}</span>
      </div>
    </div>`;

  // Legal footer (quotes only)
  let legalHtml = "";
  if (isQuote) {
    const q = data as QuoteData;
    legalHtml = `
    <div class="legal-section">
      <p>${escapeHtml(q.disclaimerText)}</p>
      <p>${escapeHtml(q.additionalWorkClause)}</p>
      ${q.warrantyText ? `<p>Garantii: ${escapeHtml(q.warrantyText)}</p>` : ""}
      ${q.withdrawalNotice ? `<p>${escapeHtml(q.withdrawalNotice)}</p>` : ""}
    </div>`;
  }

  // Notes
  const notesHtml = data.notes
    ? `<div class="notes-section">
        <h3>Märkmed</h3>
        <p>${escapeHtml(data.notes)}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="utf-8">
  <title>${title} ${escapeHtml(data.documentNumber)}</title>
  <style>
    @page { margin: 0; size: A4; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 9pt;
      color: #1e293b;
      background: white;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 22mm;
      position: relative;
    }

    /* ─── Header ─── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8mm;
      padding-bottom: 5mm;
      border-bottom: 2px solid ${accentColor};
    }

    .company-info h1 {
      font-size: 16pt;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 2mm;
    }

    .company-info p {
      font-size: 8pt;
      color: #64748b;
      line-height: 1.6;
    }

    .document-badge {
      text-align: right;
    }

    .document-badge h2 {
      font-size: 12pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .document-badge .doc-number {
      font-size: 11pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 1mm;
    }

    /* ─── Parties ─── */
    .parties {
      display: flex;
      gap: 10mm;
      margin-bottom: 6mm;
    }

    .party {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3mm;
      padding: 4mm 5mm;
    }

    .party-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 2mm;
    }

    .party-name {
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 1mm;
    }

    .party-detail {
      font-size: 8pt;
      color: #64748b;
      line-height: 1.6;
    }

    /* ─── Meta grid ─── */
    .meta-grid {
      display: flex;
      gap: 6mm;
      margin-bottom: 6mm;
      padding: 3mm 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #94a3b8;
      font-weight: 500;
    }

    .meta-value {
      font-size: 9pt;
      font-weight: 600;
    }

    /* ─── Table ─── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4mm;
    }

    thead th {
      background: ${accentColor};
      color: white;
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 2.5mm 3mm;
      text-align: left;
    }

    thead th.right { text-align: right; }
    thead th.center { text-align: center; }

    tbody td {
      padding: 2mm 3mm;
      border-bottom: 1px solid #f1f5f9;
      font-size: 8.5pt;
    }

    tbody td.nr {
      color: #94a3b8;
      width: 8mm;
    }

    tbody td.right { text-align: right; }
    tbody td.center { text-align: center; }
    tbody td.bold { font-weight: 600; }

    .section-header td {
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      padding: 2mm 3mm 1mm;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    /* ─── Totals ─── */
    .totals-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 6mm;
    }

    .totals-inner {
      width: 70mm;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 1.5mm 0;
      font-size: 8.5pt;
    }

    .totals-row span:first-child {
      color: #64748b;
    }

    .grand-total {
      border-top: 2px solid ${accentColor};
      margin-top: 1mm;
      padding-top: 2mm;
      font-size: 11pt;
      font-weight: 700;
    }

    .grand-total span:first-child {
      color: #1e293b !important;
    }

    /* ─── Payment ─── */
    .payment-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3mm;
      padding: 4mm 5mm;
      margin-bottom: 5mm;
    }

    .payment-section h3 {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 2mm;
    }

    .payment-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1mm 4mm;
      font-size: 8.5pt;
    }

    .payment-label {
      color: #64748b;
      font-weight: 500;
    }

    .mono {
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      letter-spacing: 0.3px;
    }

    /* ─── Notes ─── */
    .notes-section {
      margin-bottom: 4mm;
    }

    .notes-section h3 {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 1.5mm;
    }

    .notes-section p {
      font-size: 8pt;
      color: #475569;
      line-height: 1.5;
    }

    /* ─── Legal ─── */
    .legal-section {
      margin-top: 4mm;
      padding-top: 3mm;
      border-top: 1px solid #e2e8f0;
    }

    .legal-section p {
      font-size: 7pt;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1.5mm;
    }

    /* ─── Footer ─── */
    .footer {
      position: absolute;
      bottom: 12mm;
      left: 22mm;
      right: 22mm;
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 2mm;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>${escapeHtml(biz.companyName)}</h1>
        <p>
          Reg. nr: ${escapeHtml(biz.registryCode)}${biz.isVatRegistered && biz.kmkrNumber ? ` | KMKR: ${escapeHtml(biz.kmkrNumber)}` : ""}<br>
          ${escapeHtml(biz.address)}<br>
          ${escapeHtml(biz.email)} | ${escapeHtml(biz.phone)}
        </p>
      </div>
      <div class="document-badge">
        <h2>${title}</h2>
        <div class="doc-number">${escapeHtml(data.documentNumber)}</div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-label">Müüja / Teenuse osutaja</div>
        <div class="party-name">${escapeHtml(biz.companyName)}</div>
        <div class="party-detail">
          Reg. nr: ${escapeHtml(biz.registryCode)}<br>
          ${biz.isVatRegistered && biz.kmkrNumber ? `KMKR: ${escapeHtml(biz.kmkrNumber)}<br>` : ""}
          ${escapeHtml(biz.address)}<br>
          ${escapeHtml(biz.phone)} | ${escapeHtml(biz.email)}
        </div>
      </div>
      <div class="party">
        <div class="party-label">${isQuote ? "Tellija" : "Ostja"}</div>
        <div class="party-name">${escapeHtml(client.name)}</div>
        <div class="party-detail">
          ${client.registryCode ? `Reg. nr: ${escapeHtml(client.registryCode)}<br>` : ""}
          ${client.kmkrNumber ? `KMKR: ${escapeHtml(client.kmkrNumber)}<br>` : ""}
          ${escapeHtml(client.address)}
          ${client.email ? `<br>${escapeHtml(client.email)}` : ""}
          ${client.phone ? ` | ${escapeHtml(client.phone)}` : ""}
          ${client.contactPerson ? `<br>Kontakt: ${escapeHtml(client.contactPerson)}` : ""}
        </div>
      </div>
    </div>

    <!-- Meta -->
    ${metaHtml}

    <!-- Line Items -->
    <table>
      <thead>
        <tr>
          <th>Nr</th>
          <th>Kirjeldus</th>
          <th class="right">Kogus</th>
          <th class="center">Ühik</th>
          <th class="right">Ühikuhind</th>
          <th class="right">Kokku</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-box">
      <div class="totals-inner">
        ${totalsHtml}
      </div>
    </div>

    <!-- Payment details -->
    ${paymentHtml}

    <!-- Notes -->
    ${notesHtml}

    <!-- Legal (quotes only) -->
    ${legalHtml}

    <!-- Footer -->
    <div class="footer">
      ${escapeHtml(biz.companyName)} | Reg. nr: ${escapeHtml(biz.registryCode)}${biz.isVatRegistered && biz.kmkrNumber ? ` | KMKR: ${escapeHtml(biz.kmkrNumber)}` : ""} | ${escapeHtml(biz.address)} | ${escapeHtml(biz.email)} | ${escapeHtml(biz.phone)}
    </div>
  </div>
</body>
</html>`;
}
