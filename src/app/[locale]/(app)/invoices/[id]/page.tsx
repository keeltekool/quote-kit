"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import type { LineItem, ClientSnapshot, BusinessSnapshot } from "@/lib/db/schema";

type Invoice = {
  id: string;
  invoiceNumber: string;
  quoteId: string | null;
  status: string;
  clientSnapshot: ClientSnapshot;
  businessSnapshot: BusinessSnapshot;
  lineItems: LineItem[];
  notes: string | null;
  subtotal: string;
  vatRate: string | null;
  vatAmount: string | null;
  total: string;
  invoiceDate: string;
  serviceDate: string | null;
  dueDate: string;
  paymentTermsDays: number;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  issued: "bg-blue-50 text-blue-600 border-blue-200",
  sent: "bg-fjord-50 text-fjord-700 border-fjord-200",
  paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
  overdue: "bg-red-50 text-red-600 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function InvoiceDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (!res.ok) {
        router.push("/invoices");
        return;
      }
      const { data } = await res.json();
      setInvoice(data);
      setLoading(false);
    };
    fetchInvoice();
  }, [params.id, router]);

  const [exporting, setExporting] = useState(false);

  const handleShare = async (method: "whatsapp" | "email") => {
    if (!invoice) return;

    const res = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentType: "invoice", documentId: invoice.id }),
    });
    if (!res.ok) {
      alert("PDF genereerimine ebaõnnestus");
      return;
    }

    const blob = await res.blob();
    const file = new File([blob], `Arve_${invoice.invoiceNumber}.pdf`, {
      type: "application/pdf",
    });

    if (method === "whatsapp" && navigator.share) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        // Fallback
      }
    }

    if (method === "email") {
      const biz = invoice.businessSnapshot;
      const subject = encodeURIComponent(
        `Arve ${invoice.invoiceNumber} — ${biz.companyName}`
      );
      window.open(`mailto:${invoice.clientSnapshot.email || ""}?subject=${subject}`);
    }

    // Download as fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!invoice) return;
    setExporting(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "invoice", documentId: invoice.id }),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Arve_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF genereerimine ebaõnnestus");
    }
    setExporting(false);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!invoice) return;
    await fetch(`/api/invoices/${invoice.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/invoices/${invoice.id}`);
    const { data } = await res.json();
    setInvoice(data);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("et-EE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatMoney = (v: string) =>
    `€${parseFloat(v).toLocaleString("et-EE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading || !invoice) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("invoices.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  const labor = invoice.lineItems.filter((i) => !i.isMaterial);
  const materials = invoice.lineItems.filter((i) => i.isMaterial);
  const isOverdue =
    invoice.status === "sent" && new Date(invoice.dueDate) < new Date();
  const biz = invoice.businessSnapshot;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/invoices")}
            className="text-sm text-fjord-600 hover:text-fjord-700 mb-2 inline-block"
          >
            &larr; {t("invoices.title")}
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="font-mono">{invoice.invoiceNumber}</span>
            <span
              className={`text-sm px-2.5 py-1 rounded-full border ${
                isOverdue
                  ? statusColors.overdue
                  : statusColors[invoice.status] || "bg-gray-100 border-gray-200"
              }`}
            >
              {isOverdue ? t("invoices.overdue") : t(`invoices.${invoice.status}`)}
            </span>
            {invoice.quoteId && (
              <span className="text-xs font-normal text-muted">
                (pakkumisest)
              </span>
            )}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-fjord-700 border border-fjord-200 rounded-lg hover:bg-fjord-50 disabled:opacity-50"
          >
            {exporting ? "..." : "PDF"}
          </button>
          <button
            onClick={() => handleShare("whatsapp")}
            className="px-3 py-2 text-sm text-fjord-600 border border-border rounded-lg hover:bg-fjord-50"
          >
            WhatsApp
          </button>
          <button
            onClick={() => handleShare("email")}
            className="px-3 py-2 text-sm text-fjord-600 border border-border rounded-lg hover:bg-fjord-50"
          >
            E-post
          </button>
          {(invoice.status === "issued" || invoice.status === "sent") && (
            <button
              onClick={() => handleStatusUpdate("paid")}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              {t("invoices.markPaid")}
            </button>
          )}
          {invoice.status === "issued" && (
            <button
              onClick={() => handleStatusUpdate("sent")}
              className="px-4 py-2 text-sm font-medium text-fjord-700 border border-fjord-200 rounded-lg hover:bg-fjord-50"
            >
              {t("invoices.markSent")}
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button
              onClick={() => {
                if (confirm("Tühistada arve?")) handleStatusUpdate("cancelled");
              }}
              className="px-3 py-2 text-sm text-muted hover:text-error border border-border rounded-lg hover:border-red-300"
            >
              {t("invoices.cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Seller */}
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider mb-2">
            {t("invoices.seller")}
          </h3>
          <p className="font-semibold">{biz.companyName}</p>
          <p className="text-sm text-muted">
            Reg. nr: {biz.registryCode}
          </p>
          {biz.isVatRegistered && biz.kmkrNumber && (
            <p className="text-sm text-muted">KMKR: {biz.kmkrNumber}</p>
          )}
          <p className="text-sm text-muted">{biz.address}</p>
          <p className="text-sm text-muted">{biz.email}</p>
          <p className="text-sm text-muted">{biz.phone}</p>
        </div>

        {/* Client */}
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider mb-2">
            {t("invoices.client")}
          </h3>
          <p className="font-semibold">{invoice.clientSnapshot.name}</p>
          {invoice.clientSnapshot.registryCode && (
            <p className="text-sm text-muted">
              Reg. nr: {invoice.clientSnapshot.registryCode}
            </p>
          )}
          {invoice.clientSnapshot.kmkrNumber && (
            <p className="text-sm text-muted">
              KMKR: {invoice.clientSnapshot.kmkrNumber}
            </p>
          )}
          <p className="text-sm text-muted">
            {invoice.clientSnapshot.address}
          </p>
          {invoice.clientSnapshot.email && (
            <p className="text-sm text-muted">
              {invoice.clientSnapshot.email}
            </p>
          )}
        </div>
      </div>

      {/* Invoice metadata */}
      <div className="bg-white border border-border rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider block">Arve kuupäev</span>
            <span className="font-medium font-mono">{formatDate(invoice.invoiceDate)}</span>
          </div>
          {invoice.serviceDate && (
            <div>
              <span className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider block">
                {t("invoices.serviceDate")}
              </span>
              <span className="font-medium font-mono">
                {formatDate(invoice.serviceDate)}
              </span>
            </div>
          )}
          <div>
            <span className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider block">Maksetähtaeg</span>
            <span
              className={`font-medium font-mono ${
                isOverdue ? "text-red-600" : ""
              }`}
            >
              {formatDate(invoice.dueDate)}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider block">Maksetingimused</span>
            <span className="font-medium">
              {invoice.paymentTermsDays} päeva
            </span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-fjord-50">
              <th className="text-left px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide w-8">Nr</th>
              <th className="text-left px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">Kirjeldus</th>
              <th className="text-right px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">Kogus</th>
              <th className="text-center px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">Ühik</th>
              <th className="text-right px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">Ühikuhind</th>
              <th className="text-right px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">Kokku</th>
            </tr>
          </thead>
          <tbody>
            {/* Labor items */}
            {labor.length > 0 && (
              <>
                <tr className="bg-fjord-50/50">
                  <td
                    colSpan={6}
                    className="px-4 py-1.5 text-[11px] font-bold text-fjord-600 uppercase tracking-wide"
                  >
                    Tööd
                  </td>
                </tr>
                {labor.map((item, i) => (
                  <tr key={`l-${i}`} className="border-b border-fjord-50">
                    <td className="px-4 py-2.5 text-fjord-600">{i + 1}</td>
                    <td className="px-4 py-2.5">{item.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-center">{item.unit}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatMoney(item.unitPrice.toFixed(2))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {formatMoney(item.total.toFixed(2))}
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Material items */}
            {materials.length > 0 && (
              <>
                <tr className="bg-fjord-50/50">
                  <td
                    colSpan={6}
                    className="px-4 py-1.5 text-[11px] font-bold text-fjord-600 uppercase tracking-wide"
                  >
                    Materjalid
                  </td>
                </tr>
                {materials.map((item, i) => (
                  <tr key={`m-${i}`} className="border-b border-fjord-50">
                    <td className="px-4 py-2.5 text-fjord-600">
                      {labor.length + i + 1}
                    </td>
                    <td className="px-4 py-2.5">{item.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-center">{item.unit}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatMoney(item.unitPrice.toFixed(2))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">
                      {formatMoney(item.total.toFixed(2))}
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Fallback if no separation */}
            {labor.length === 0 &&
              materials.length === 0 &&
              invoice.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-fjord-50">
                  <td className="px-4 py-2.5 text-fjord-600">{i + 1}</td>
                  <td className="px-4 py-2.5">{item.description}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2.5 text-center">{item.unit}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {formatMoney(item.unitPrice.toFixed(2))}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">
                    {formatMoney(item.total.toFixed(2))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-border px-4 py-4">
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Vahesumma:</span>
                <span className="font-mono">
                  {formatMoney(invoice.subtotal)}
                </span>
              </div>
              {invoice.vatRate && invoice.vatAmount && (
                <div className="flex justify-between">
                  <span className="text-muted">
                    KM {parseFloat(invoice.vatRate)}%:
                  </span>
                  <span className="font-mono">
                    {formatMoney(invoice.vatAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold font-mono text-base pt-2 border-t-2 border-fjord-100">
                <span>KOKKU:</span>
                <span>
                  {formatMoney(invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-white border border-border rounded-xl p-4 mb-6">
        <h3 className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider mb-3">
          Makserekvisiidid
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted">Saaja:</span>
          <span className="font-medium">{biz.companyName}</span>
          <span className="text-muted">IBAN:</span>
          <span className="font-mono">{biz.iban}</span>
          <span className="text-muted">Pank:</span>
          <span>{biz.bankName}</span>
          <span className="text-muted">Selgitus:</span>
          <span className="font-mono">{invoice.invoiceNumber}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 mb-6">
          <h3 className="text-[11px] font-semibold text-fjord-600 uppercase tracking-wider mb-2">
            Märkmed
          </h3>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}

      {/* Paid / Cancelled info */}
      {invoice.paidAt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-emerald-800">
            Makstud: {formatDate(invoice.paidAt)}
          </p>
        </div>
      )}
      {invoice.cancelledAt && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600">
            Tühistatud: {formatDate(invoice.cancelledAt)}
          </p>
        </div>
      )}

      {/* Footer info */}
      <div className="bg-fjord-50 border border-border rounded-xl p-4 text-xs text-muted">
        <p>
          Reg. nr: {biz.registryCode}
          {biz.isVatRegistered && biz.kmkrNumber && ` | KMKR: ${biz.kmkrNumber}`}
        </p>
        <p>{biz.address} | {biz.email} | {biz.phone}</p>
      </div>
    </div>
  );
}
