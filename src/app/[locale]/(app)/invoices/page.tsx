"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  clientSnapshot: { name: string };
  subtotal: string;
  vatAmount: string | null;
  total: string;
  invoiceDate: string;
  dueDate: string;
  paidAt: string | null;
};

const statusColors: Record<string, string> = {
  issued: "bg-blue-50 text-blue-600 border-blue-200",
  sent: "bg-fjord-50 text-fjord-700 border-fjord-200",
  paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
  overdue: "bg-red-50 text-red-600 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const statuses = ["all", "issued", "sent", "paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const t = useTranslations();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices?status=${filter}`);
    const { data } = await res.json();
    setInvoices(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleStatusUpdate = async (id: string, status: string) => {
    await fetch(`/api/invoices/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchInvoices();
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

  const isOverdue = (inv: Invoice) =>
    inv.status === "sent" && new Date(inv.dueDate) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("invoices.title")}</h1>
        <button
          onClick={() => router.push("/invoices/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-fjord-700 rounded-lg hover:bg-fjord-800 transition-colors"
        >
          + {t("invoices.new")}
        </button>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              filter === s
                ? "bg-fjord-700 text-white"
                : "text-fjord-600 hover:bg-fjord-50"
            }`}
          >
            {s === "all" ? "Kõik" : t(`invoices.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">{t("common.loading")}</p>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>Arveid pole veel loodud.</p>
          <button
            onClick={() => router.push("/invoices/new")}
            className="mt-3 text-fjord-700 font-medium hover:underline"
          >
            + {t("invoices.new")}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-fjord-50">
                <th className="text-left px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">
                  {t("invoices.number")}
                </th>
                <th className="text-left px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">
                  {t("invoices.client")}
                </th>
                <th className="text-right px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide hidden md:table-cell">
                  {t("invoices.amount")}
                </th>
                <th className="text-center px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide">
                  {t("invoices.status")}
                </th>
                <th className="text-left px-4 py-2.5 text-[13px] font-semibold text-fjord-600 uppercase tracking-wide hidden lg:table-cell">
                  {t("invoices.dueDate")}
                </th>
                <th className="px-4 py-2.5 w-28" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-fjord-50 last:border-0 hover:bg-fjord-50/50"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="font-medium font-mono text-xs text-fjord-700 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="font-medium hover:text-fjord-700 text-left"
                    >
                      {inv.clientSnapshot.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell font-mono">
                    {formatMoney(inv.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium ${
                        isOverdue(inv)
                          ? "bg-red-50 text-red-600 border-red-200"
                          : statusColors[inv.status] || "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {isOverdue(inv) ? t("invoices.overdue") : t(`invoices.${inv.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted hidden lg:table-cell">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(inv.status === "issued" || inv.status === "sent") && (
                      <button
                        onClick={() => handleStatusUpdate(inv.id, "paid")}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        {t("invoices.markPaid")}
                      </button>
                    )}
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
