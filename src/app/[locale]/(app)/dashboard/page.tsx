"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type ClientSnapshot = { name: string };

type QuoteSummary = {
  id: string;
  quoteNumber: string;
  status: string;
  clientSnapshot: ClientSnapshot;
  total: string;
  createdAt: string;
  validUntil: string;
};

type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: string;
  clientSnapshot: ClientSnapshot;
  total: string;
  invoiceDate: string;
  dueDate: string;
  paidAt: string | null;
};

type StatusStats = Record<string, { count: number; total: number }>;

type DashboardData = {
  quotes: {
    total: number;
    totalValue: number;
    byStatus: StatusStats;
  };
  invoices: {
    total: number;
    totalValue: number;
    byStatus: StatusStats;
    pendingPayments: number;
    pendingCount: number;
    overdueCount: number;
  };
  recentQuotes: QuoteSummary[];
  recentInvoices: InvoiceSummary[];
};

const quoteStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
  expired: "bg-amber-50 text-amber-700",
  invoiced: "bg-purple-50 text-purple-700",
};

const invoiceStatusColors: Record<string, string> = {
  issued: "bg-blue-50 text-blue-700",
  sent: "bg-indigo-50 text-indigo-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      });
  }, []);

  const formatMoney = (v: number | string) =>
    `€${parseFloat(String(v)).toLocaleString("et-EE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("et-EE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const isOverdue = (inv: InvoiceSummary) =>
    inv.status === "sent" && new Date(inv.dueDate) < new Date();

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!data) return null;

  const acceptedQuotes = data.quotes.byStatus["accepted"]?.count || 0;
  const acceptedValue = data.quotes.byStatus["accepted"]?.total || 0;
  const paidValue = data.invoices.byStatus["paid"]?.total || 0;

  return (
    <div>
      {/* Header with quick actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/quotes/new")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + {t("dashboard.newQuote")}
          </button>
          <button
            onClick={() => router.push("/invoices/new")}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            + {t("dashboard.newInvoice")}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Quotes */}
        <button
          onClick={() => router.push("/quotes")}
          className="bg-white border border-border rounded-xl p-5 text-left hover:border-blue-300 transition-colors"
        >
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            {t("dashboard.totalQuotes")}
          </p>
          <p className="text-2xl font-bold mt-1">{data.quotes.total}</p>
          <p className="text-xs text-muted mt-1">
            {formatMoney(data.quotes.totalValue)}
          </p>
        </button>

        {/* Accepted Quotes */}
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            {t("dashboard.acceptedQuotes")}
          </p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {acceptedQuotes}
          </p>
          <p className="text-xs text-muted mt-1">
            {formatMoney(acceptedValue)}
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            {t("dashboard.pendingPayments")}
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-600">
            {data.invoices.pendingCount}
          </p>
          <p className="text-xs text-muted mt-1">
            {formatMoney(data.invoices.pendingPayments)}
          </p>
          {data.invoices.overdueCount > 0 && (
            <p className="text-xs text-red-600 font-medium mt-1">
              {data.invoices.overdueCount} t&auml;htaja &uuml;letanud
            </p>
          )}
        </div>

        {/* Total Invoiced (paid) */}
        <button
          onClick={() => router.push("/invoices")}
          className="bg-white border border-border rounded-xl p-5 text-left hover:border-blue-300 transition-colors"
        >
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            {t("dashboard.totalInvoices")}
          </p>
          <p className="text-2xl font-bold mt-1">{data.invoices.total}</p>
          <p className="text-xs text-emerald-600 mt-1">
            {formatMoney(paidValue)} makstud
          </p>
        </button>
      </div>

      {/* Recent items — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
            <h2 className="text-sm font-semibold">
              {t("dashboard.recentQuotes")}
            </h2>
            <button
              onClick={() => router.push("/quotes")}
              className="text-xs text-blue-600 hover:underline"
            >
              {t("quotes.title")} &rarr;
            </button>
          </div>

          {data.recentQuotes.length === 0 ? (
            <div className="p-6 text-center text-muted text-sm">
              <p>Pakkumisi pole veel loodud.</p>
              <button
                onClick={() => router.push("/quotes/new")}
                className="mt-2 text-blue-600 font-medium hover:underline"
              >
                + {t("dashboard.newQuote")}
              </button>
            </div>
          ) : (
            <div>
              {data.recentQuotes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => router.push(`/quotes/${q.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3 border-b border-border last:border-0 hover:bg-surface/50 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-blue-600">
                        {q.quoteNumber}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          quoteStatusColors[q.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t(`quotes.${q.status}`)}
                      </span>
                    </div>
                    <p className="text-sm truncate mt-0.5">
                      {q.clientSnapshot.name}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-mono text-sm font-medium">
                      {formatMoney(q.total)}
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatDate(q.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
            <h2 className="text-sm font-semibold">
              {t("dashboard.recentInvoices")}
            </h2>
            <button
              onClick={() => router.push("/invoices")}
              className="text-xs text-blue-600 hover:underline"
            >
              {t("invoices.title")} &rarr;
            </button>
          </div>

          {data.recentInvoices.length === 0 ? (
            <div className="p-6 text-center text-muted text-sm">
              <p>Arveid pole veel loodud.</p>
              <button
                onClick={() => router.push("/invoices/new")}
                className="mt-2 text-blue-600 font-medium hover:underline"
              >
                + {t("dashboard.newInvoice")}
              </button>
            </div>
          ) : (
            <div>
              {data.recentInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3 border-b border-border last:border-0 hover:bg-surface/50 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-blue-600">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isOverdue(inv)
                            ? "bg-red-50 text-red-700"
                            : invoiceStatusColors[inv.status] ||
                              "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isOverdue(inv)
                          ? t("invoices.overdue")
                          : t(`invoices.${inv.status}`)}
                      </span>
                    </div>
                    <p className="text-sm truncate mt-0.5">
                      {inv.clientSnapshot.name}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-mono text-sm font-medium">
                      {formatMoney(inv.total)}
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatDate(inv.invoiceDate)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
