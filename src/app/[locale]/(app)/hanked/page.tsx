"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Procurement = {
  id: number;
  notice_id: string;
  procurement_id: string;
  title: string;
  description: string | null;
  contracting_auth: string;
  contracting_auth_reg: string | null;
  contract_type: string | null;
  procedure_type: string | null;
  cpv_primary: string | null;
  estimated_value: string | null;
  nuts_code: string | null;
  nuts_name: string | null;
  submission_deadline: string | null;
  publication_date: string | null;
  status: string;
  source_url: string | null;
  trade_tags: string[];
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  performance_address: string | null;
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 border-emerald-200",
  expired: "bg-amber-50 text-amber-600 border-amber-200",
  awarded: "bg-blue-50 text-blue-600 border-blue-200",
};

const tradeTagColors: Record<string, string> = {
  plumbing: "bg-blue-50 text-blue-700",
  electrical: "bg-yellow-50 text-yellow-700",
  painting: "bg-pink-50 text-pink-700",
  hvac: "bg-orange-50 text-orange-700",
  general: "bg-gray-100 text-gray-700",
  maintenance: "bg-purple-50 text-purple-700",
};

const TRADES = ["all", "plumbing", "electrical", "painting", "hvac", "general", "maintenance"];
const STATUSES = ["active", "expired", "awarded"];
const SORTS = ["deadline", "value", "newest"];

export default function HankedPage() {
  const t = useTranslations();
  const router = useRouter();

  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userTrade, setUserTrade] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("active");
  const [tradeFilter, setTradeFilter] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

  // Detail modal
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);
  const [creatingQuote, setCreatingQuote] = useState(false);

  const fetchProcurements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("sort", sortBy);
      if (tradeFilter && tradeFilter !== "all") {
        params.set("trade", tradeFilter);
      }
      const res = await fetch(`/api/hanked?${params.toString()}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setProcurements(data.data || []);
      if (data.userTrade) setUserTrade(data.userTrade);
    } catch {
      setError("load");
    }
    setLoading(false);
  }, [statusFilter, tradeFilter, sortBy]);

  useEffect(() => {
    fetchProcurements();
  }, [fetchProcurements]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("et-EE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatMoney = (v: string) =>
    `\u20AC${parseFloat(v).toLocaleString("et-EE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const daysUntilDeadline = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleCreateQuote = async (p: Procurement) => {
    setCreatingQuote(true);
    try {
      // Find or create client from procurement data
      const res = await fetch("/api/hanked/create-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractingAuth: p.contracting_auth,
          contractingAuthReg: p.contracting_auth_reg,
          contactPerson: p.contact_person,
          contactEmail: p.contact_email,
          contactPhone: p.contact_phone,
          performanceAddress: p.performance_address,
        }),
      });

      if (!res.ok) throw new Error("Failed to create client");
      const { data } = await res.json();

      // Navigate to new quote with pre-filled data
      const params = new URLSearchParams();
      params.set("clientId", data.clientId);
      params.set("hankeRef", p.notice_id);
      params.set("hankeTitle", p.title);
      router.push(`/quotes/new?${params.toString()}`);
    } catch {
      alert("Pakkumise loomine ebaõnnestus");
    }
    setCreatingQuote(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("hanked.title")}</h1>
        <p className="text-sm text-muted mt-1">
          {t("hanked.subtitle")}
          {userTrade && (
            <span className="ml-1 text-fjord-700 font-medium">
              ({t(`tradeTypes.${userTrade}`)})
            </span>
          )}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status filter */}
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-fjord-700 text-white"
                  : "text-fjord-600 hover:bg-fjord-50"
              }`}
            >
              {t(`hanked.${s}`)}
            </button>
          ))}
        </div>

        {/* Trade filter */}
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs outline-none focus:border-fjord-700"
        >
          <option value="">{t("hanked.allTrades")}</option>
          {TRADES.filter((t) => t !== "all").map((trade) => (
            <option key={trade} value={trade}>
              {t(`hanked.tradeTags.${trade}`)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs outline-none focus:border-fjord-700"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`hanked.sort${s.charAt(0).toUpperCase() + s.slice(1)}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-muted">
          <div className="inline-block w-6 h-6 border-2 border-fjord-300 border-t-fjord-700 rounded-full animate-spin mb-3" />
          <p>{t("hanked.loading")}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16">
          <p className="text-muted mb-3">{t("hanked.loadError")}</p>
          <button
            onClick={fetchProcurements}
            className="text-sm text-fjord-700 font-medium hover:underline"
          >
            {t("hanked.retry")}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && procurements.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p>{t("hanked.noResults")}</p>
          <p className="text-xs mt-2">{t("hanked.noResultsHint")}</p>
        </div>
      )}

      {/* Procurement cards */}
      {!loading && !error && procurements.length > 0 && (
        <div className="space-y-3">
          {procurements.map((p) => {
            const deadline = p.submission_deadline
              ? daysUntilDeadline(p.submission_deadline)
              : null;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedProcurement(p)}
                className="w-full text-left bg-white border border-border rounded-xl p-4 hover:border-fjord-300 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0 mr-3">
                    {p.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                      statusColors[p.status] || "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {t(`hanked.${p.status}`)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  {/* Contracting authority */}
                  <span>{p.contracting_auth}</span>

                  {/* Deadline */}
                  {p.submission_deadline && (
                    <span
                      className={`font-medium ${
                        deadline !== null && deadline <= 7
                          ? deadline <= 0
                            ? "text-error"
                            : "text-warning"
                          : "text-muted"
                      }`}
                    >
                      {formatDate(p.submission_deadline)}
                      {deadline !== null && deadline > 0 && (
                        <span className="ml-1">({deadline}d)</span>
                      )}
                    </span>
                  )}

                  {/* Value */}
                  {p.estimated_value && (
                    <span className="font-mono font-medium text-foreground">
                      {formatMoney(p.estimated_value)}
                    </span>
                  )}

                  {/* Region */}
                  {p.nuts_name && <span>{p.nuts_name}</span>}
                </div>

                {/* Trade tags */}
                {p.trade_tags && p.trade_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.trade_tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          tradeTagColors[tag] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t(`hanked.tradeTags.${tag}`)}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedProcurement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedProcurement(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 rounded-t-2xl flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-lg font-bold leading-snug">
                  {selectedProcurement.title}
                </h2>
                <p className="text-sm text-muted mt-0.5">
                  {selectedProcurement.contracting_auth}
                  {selectedProcurement.contracting_auth_reg && (
                    <span className="ml-1">
                      ({selectedProcurement.contracting_auth_reg})
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedProcurement(null)}
                className="text-muted hover:text-foreground text-xl px-2"
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4">
              {/* Status + deadline */}
              <div className="flex flex-wrap gap-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium ${
                    statusColors[selectedProcurement.status] || "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {t(`hanked.${selectedProcurement.status}`)}
                </span>
                {selectedProcurement.submission_deadline && (() => {
                  const days = daysUntilDeadline(selectedProcurement.submission_deadline);
                  return (
                    <span
                      className={`text-sm font-medium ${
                        days <= 0 ? "text-error" : days <= 7 ? "text-warning" : "text-muted"
                      }`}
                    >
                      {t("hanked.deadline")}: {formatDate(selectedProcurement.submission_deadline)}
                      {days > 0
                        ? ` (${days} ${days === 1 ? "day" : "days"})`
                        : ` — ${t("hanked.deadlinePassed")}`}
                    </span>
                  );
                })()}
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedProcurement.estimated_value && (
                  <div>
                    <span className="text-muted block text-xs">{t("hanked.estimatedValue")}</span>
                    <span className="font-mono font-semibold">
                      {formatMoney(selectedProcurement.estimated_value)}
                    </span>
                  </div>
                )}
                {selectedProcurement.nuts_name && (
                  <div>
                    <span className="text-muted block text-xs">{t("hanked.region")}</span>
                    <span>{selectedProcurement.nuts_name}</span>
                  </div>
                )}
                {selectedProcurement.procedure_type && (
                  <div>
                    <span className="text-muted block text-xs">{t("hanked.procedure")}</span>
                    <span>{selectedProcurement.procedure_type}</span>
                  </div>
                )}
                {selectedProcurement.cpv_primary && (
                  <div>
                    <span className="text-muted block text-xs">{t("hanked.cpvCode")}</span>
                    <span className="font-mono">{selectedProcurement.cpv_primary}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedProcurement.description && (
                <div>
                  <span className="text-muted block text-xs mb-1">{t("hanked.description")}</span>
                  <p className="text-sm leading-relaxed">{selectedProcurement.description}</p>
                </div>
              )}

              {/* Contact info */}
              {(selectedProcurement.contact_person ||
                selectedProcurement.contact_email ||
                selectedProcurement.contact_phone ||
                selectedProcurement.performance_address) && (
                <div className="border-t border-border pt-3 space-y-1.5">
                  {selectedProcurement.contact_person && (
                    <div className="text-sm">
                      <span className="text-muted text-xs">{t("hanked.contactPerson")}: </span>
                      {selectedProcurement.contact_person}
                    </div>
                  )}
                  {selectedProcurement.contact_email && (
                    <div className="text-sm">
                      <span className="text-muted text-xs">{t("hanked.contactEmail")}: </span>
                      <a
                        href={`mailto:${selectedProcurement.contact_email}`}
                        className="text-fjord-700 hover:underline"
                      >
                        {selectedProcurement.contact_email}
                      </a>
                    </div>
                  )}
                  {selectedProcurement.contact_phone && (
                    <div className="text-sm">
                      <span className="text-muted text-xs">{t("hanked.contactPhone")}: </span>
                      {selectedProcurement.contact_phone}
                    </div>
                  )}
                  {selectedProcurement.performance_address && (
                    <div className="text-sm">
                      <span className="text-muted text-xs">{t("hanked.address")}: </span>
                      {selectedProcurement.performance_address}
                    </div>
                  )}
                </div>
              )}

              {/* Trade tags */}
              {selectedProcurement.trade_tags && selectedProcurement.trade_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProcurement.trade_tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        tradeTagColors[tag] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(`hanked.tradeTags.${tag}`)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 rounded-b-2xl flex flex-wrap gap-3">
              {selectedProcurement.source_url && (
                <a
                  href={selectedProcurement.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-fjord-700 border border-fjord-200 rounded-lg hover:bg-fjord-50 transition-colors"
                >
                  {t("hanked.viewOnRhr")} &rarr;
                </a>
              )}
              <div className="flex-1" />
              {selectedProcurement.status === "active" && (
                <button
                  onClick={() => handleCreateQuote(selectedProcurement)}
                  disabled={creatingQuote}
                  className="px-5 py-2 text-sm font-medium text-white bg-fjord-700 rounded-lg hover:bg-fjord-800 disabled:opacity-50 transition-colors"
                >
                  {creatingQuote ? t("common.loading") : t("hanked.createQuote")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
