"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import type { LineItem, ClientSnapshot, BusinessSnapshot } from "@/lib/db/schema";

type Quote = {
  id: string;
  quoteNumber: string;
  status: string;
  clientSnapshot: ClientSnapshot;
  businessSnapshot: BusinessSnapshot;
  lineItems: LineItem[];
  notes: string | null;
  aiJobDescription: string | null;
  subtotal: string;
  vatRate: string | null;
  vatAmount: string | null;
  total: string;
  validityDays: number;
  validUntil: string;
  paymentTermsDays: number;
  warrantyText: string | null;
  disclaimerText: string;
  additionalWorkClause: string;
  withdrawalNotice: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-50 text-blue-700",
  viewed: "bg-indigo-50 text-indigo-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
  expired: "bg-amber-50 text-amber-700",
  invoiced: "bg-purple-50 text-purple-700",
};

export default function QuoteDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const res = await fetch(`/api/quotes/${params.id}`);
      if (!res.ok) {
        router.push("/quotes");
        return;
      }
      const { data } = await res.json();
      setQuote(data);
      setLoading(false);
    };
    fetchQuote();
  }, [params.id, router]);

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!quote) return;
    setExporting(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "quote", documentId: quote.id }),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Pakkumine_${quote.quoteNumber}.pdf`;
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
    if (!quote) return;
    await fetch(`/api/quotes/${quote.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Refresh
    const res = await fetch(`/api/quotes/${quote.id}`);
    const { data } = await res.json();
    setQuote(data);
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

  if (loading || !quote) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("quotes.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  const labor = quote.lineItems.filter((i) => !i.isMaterial);
  const materials = quote.lineItems.filter((i) => i.isMaterial);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/quotes")}
            className="text-sm text-muted hover:text-foreground mb-2 inline-block"
          >
            ← {t("quotes.title")}
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {quote.quoteNumber}
            <span
              className={`text-sm px-2.5 py-1 rounded ${
                statusColors[quote.status] || "bg-gray-100"
              }`}
            >
              {t(`quotes.${quote.status}`)}
            </span>
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {exporting ? "..." : "PDF"}
          </button>
          {quote.status === "draft" && (
            <button
              onClick={() => handleStatusUpdate("sent")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {t("quotes.send")}
            </button>
          )}
          {quote.status === "sent" && (
            <>
              <button
                onClick={() => handleStatusUpdate("accepted")}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                {t("quotes.markAccepted")}
              </button>
              <button
                onClick={() => handleStatusUpdate("declined")}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                {t("quotes.markDeclined")}
              </button>
            </>
          )}
          {quote.status === "accepted" && (
            <button
              onClick={() => router.push(`/invoices/new?quoteId=${quote.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              {t("quotes.convertToInvoice")}
            </button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Client */}
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-xs text-muted uppercase tracking-wide mb-2">
            {t("quotes.client")}
          </h3>
          <p className="font-semibold">{quote.clientSnapshot.name}</p>
          {quote.clientSnapshot.registryCode && (
            <p className="text-sm text-muted">
              {t("clients.registryCode")}: {quote.clientSnapshot.registryCode}
            </p>
          )}
          <p className="text-sm text-muted">{quote.clientSnapshot.address}</p>
          {quote.clientSnapshot.email && (
            <p className="text-sm text-muted">{quote.clientSnapshot.email}</p>
          )}
        </div>

        {/* Meta */}
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-xs text-muted uppercase tracking-wide mb-2">
            Pakkumise andmed
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted">{t("quotes.date")}:</span>
            <span>{formatDate(quote.createdAt)}</span>
            <span className="text-muted">{t("quotes.validUntil")}:</span>
            <span>{formatDate(quote.validUntil)}</span>
            <span className="text-muted">Maksetingimused:</span>
            <span>{quote.paymentTermsDays} päeva</span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left px-4 py-2.5 font-medium w-8">Nr</th>
              <th className="text-left px-4 py-2.5 font-medium">
                Kirjeldus
              </th>
              <th className="text-right px-4 py-2.5 font-medium">Kogus</th>
              <th className="text-center px-4 py-2.5 font-medium">Ühik</th>
              <th className="text-right px-4 py-2.5 font-medium">
                Ühikuhind
              </th>
              <th className="text-right px-4 py-2.5 font-medium">Kokku</th>
            </tr>
          </thead>
          <tbody>
            {/* Labor items */}
            {labor.length > 0 && (
              <>
                <tr className="bg-surface/30">
                  <td colSpan={6} className="px-4 py-1.5 text-xs text-muted uppercase tracking-wide font-medium">
                    Tööd
                  </td>
                </tr>
                {labor.map((item, i) => (
                  <tr key={`l-${i}`} className="border-b border-border">
                    <td className="px-4 py-2.5 text-muted">{i + 1}</td>
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
                <tr className="bg-surface/30">
                  <td colSpan={6} className="px-4 py-1.5 text-xs text-muted uppercase tracking-wide font-medium">
                    Materjalid
                  </td>
                </tr>
                {materials.map((item, i) => (
                  <tr key={`m-${i}`} className="border-b border-border">
                    <td className="px-4 py-2.5 text-muted">
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

            {/* If no separation needed (all same type) */}
            {labor.length === 0 && materials.length === 0 && quote.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-2.5 text-muted">{i + 1}</td>
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
                  {formatMoney(quote.subtotal)}
                </span>
              </div>
              {quote.vatRate && quote.vatAmount && (
                <div className="flex justify-between">
                  <span className="text-muted">
                    KM {parseFloat(quote.vatRate)}%:
                  </span>
                  <span className="font-mono">
                    {formatMoney(quote.vatAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>KOKKU:</span>
                <span className="font-mono">{formatMoney(quote.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-white border border-border rounded-xl p-4 mb-6">
          <h3 className="text-xs text-muted uppercase tracking-wide mb-2">
            Märkmed
          </h3>
          <p className="text-sm">{quote.notes}</p>
        </div>
      )}

      {/* Legal clauses */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-2 text-xs text-muted">
        <p>{quote.disclaimerText}</p>
        <p>{quote.additionalWorkClause}</p>
        {quote.warrantyText && <p>Garantii: {quote.warrantyText}</p>}
        {quote.withdrawalNotice && <p>{quote.withdrawalNotice}</p>}
      </div>
    </div>
  );
}
