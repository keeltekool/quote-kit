"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Quote = {
  id: string;
  quoteNumber: string;
  status: string;
  clientSnapshot: { name: string; clientType: string };
  subtotal: string;
  vatAmount: string | null;
  total: string;
  validUntil: string;
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

const statuses = [
  "all",
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
  "invoiced",
];

export default function QuotesPage() {
  const t = useTranslations();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/quotes?status=${filter}`);
    const { data } = await res.json();
    setQuotes(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleStatusUpdate = async (id: string, status: string) => {
    await fetch(`/api/quotes/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchQuotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kustutada mustand?")) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    fetchQuotes();
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("quotes.title")}</h1>
        <button
          onClick={() => router.push("/quotes/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {t("quotes.new")}
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {s === "all"
              ? "Kõik"
              : t(`quotes.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">{t("common.loading")}</p>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>Pakkumisi pole veel loodud.</p>
          <button
            onClick={() => router.push("/quotes/new")}
            className="mt-3 text-blue-600 font-medium hover:underline"
          >
            + {t("quotes.new")}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-medium">
                  {t("quotes.number")}
                </th>
                <th className="text-left px-4 py-2.5 font-medium">
                  {t("quotes.client")}
                </th>
                <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">
                  {t("quotes.amount")}
                </th>
                <th className="text-center px-4 py-2.5 font-medium">
                  {t("quotes.status")}
                </th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">
                  {t("quotes.date")}
                </th>
                <th className="px-4 py-2.5 w-32" />
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-border last:border-0 hover:bg-surface/50"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/quotes/${q.id}`)}
                      className="font-medium font-mono text-xs text-blue-600 hover:underline"
                    >
                      {q.quoteNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/quotes/${q.id}`)}
                      className="font-medium hover:text-blue-600 text-left"
                    >
                      {q.clientSnapshot.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell font-mono">
                    {formatMoney(q.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[q.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {t(`quotes.${q.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted hidden lg:table-cell">
                    {formatDate(q.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {q.status === "draft" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(q.id, "sent")
                          }
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {t("quotes.send")}
                        </button>
                      )}
                      {q.status === "sent" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(q.id, "accepted")
                            }
                            className="text-xs text-emerald-600 hover:underline"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(q.id, "declined")
                            }
                            className="text-xs text-red-600 hover:underline ml-1"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      {q.status === "accepted" && (
                        <button
                          onClick={() => router.push(`/invoices/new?quoteId=${q.id}`)}
                          className="text-xs text-purple-600 hover:underline"
                        >
                          {t("quotes.convertToInvoice")}
                        </button>
                      )}
                      {q.status === "draft" && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="text-xs text-muted hover:text-error ml-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
