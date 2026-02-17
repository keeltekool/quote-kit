"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

type Client = {
  id: string;
  name: string;
  clientType: string;
  registryCode: string | null;
};

type CatalogService = {
  id: string;
  nameEt: string;
  unitPrice: string;
  unit: string;
  isMaterial: boolean;
  category: string;
  isActive: boolean;
};

type LineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  isMaterial: boolean;
  catalogServiceId: string | null;
};

type QuoteData = {
  id: string;
  clientId: string;
  lineItems: LineItem[];
  notes: string | null;
  clientSnapshot: { name: string };
};

export default function NewInvoicePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId");

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [fromQuote, setFromQuote] = useState(false);

  // Load data
  const fetchData = useCallback(async () => {
    const [clientsRes, servicesRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/services"),
    ]);
    const clientsData = await clientsRes.json();
    const servicesData = await servicesRes.json();
    setClients(clientsData.data || []);
    setServices(
      (servicesData.data || []).filter((s: CatalogService) => s.isActive)
    );

    // If coming from a quote, pre-fill
    if (quoteId) {
      const quoteRes = await fetch(`/api/quotes/${quoteId}`);
      if (quoteRes.ok) {
        const { data: quote } = (await quoteRes.json()) as {
          data: QuoteData;
        };
        setSelectedClientId(quote.clientId);
        setLineItems(quote.lineItems);
        setNotes(quote.notes || "");
        setFromQuote(true);
      }
    }

    setLoading(false);
  }, [quoteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit: "tk",
        unitPrice: 0,
        total: 0,
        isMaterial: false,
        catalogServiceId: null,
      },
    ]);
  };

  const updateLineItem = (index: number, fields: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...fields };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addFromCatalog = (svc: CatalogService) => {
    const price = parseFloat(svc.unitPrice);
    setLineItems((prev) => [
      ...prev,
      {
        description: svc.nameEt,
        quantity: 1,
        unit: svc.unit,
        unitPrice: price,
        total: price,
        isMaterial: svc.isMaterial,
        catalogServiceId: svc.id,
      },
    ]);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          quoteId: quoteId || null,
          lineItems,
          notes: notes || null,
          serviceDate: serviceDate || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save");
        setSaving(false);
        return;
      }

      router.push("/invoices");
    } catch {
      alert("Save failed");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("invoices.new")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  // Group services by category
  const servicesByCategory = services.reduce(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<string, CatalogService[]>
  );

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {t("invoices.new")}
          {fromQuote && (
            <span className="text-sm font-normal text-muted ml-2">
              (pakkumisest)
            </span>
          )}
        </h1>
        <button
          onClick={() => router.push("/invoices")}
          className="text-sm text-muted hover:text-foreground"
        >
          {t("common.cancel")}
        </button>
      </div>

      {/* Client selection (skip if from quote) */}
      {!fromQuote && (
        <div className="bg-white border border-border rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold mb-3">{t("invoices.client")}</h2>
          {clients.length === 0 ? (
            <p className="text-muted text-sm">
              Lisa esmalt klient.{" "}
              <button
                onClick={() => router.push("/clients")}
                className="text-blue-600 hover:underline"
              >
                + {t("clients.new")}
              </button>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedClientId === c.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  {c.name}
                  <span
                    className={`ml-1.5 text-xs px-1 py-0.5 rounded ${
                      c.clientType === "b2b"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {c.clientType.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Service date */}
      <div className="bg-white border border-border rounded-xl p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("invoices.serviceDate")}
            </label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-muted mt-1">
              Jäta tühjaks kui sama mis arve kuupäev
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Märkmed</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Lisainfo..."
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Arve read</h2>
          <button
            onClick={addLineItem}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            + {t("quotes.addLineItem")}
          </button>
        </div>

        {/* Quick-add from catalog (standalone only) */}
        {!fromQuote && Object.keys(servicesByCategory).length > 0 && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs text-muted mb-2">Lisa kataloogist:</p>
            <div className="flex flex-wrap gap-1.5">
              {services.slice(0, 12).map((s) => (
                <button
                  key={s.id}
                  onClick={() => addFromCatalog(s)}
                  className="px-2 py-1 text-xs rounded border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  {s.nameEt} — €{parseFloat(s.unitPrice).toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}

        {lineItems.length === 0 ? (
          <div className="text-center py-6 text-muted text-sm">
            <p>Lisa arve read.</p>
            <button
              onClick={addLineItem}
              className="mt-1 text-blue-600 font-medium hover:underline"
            >
              + {t("quotes.addLineItem")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lineItems.map((item, i) => (
              <div key={i} className="p-3 border border-border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-xs text-muted mb-1">
                      Kirjeldus
                    </label>
                    <input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(i, { description: e.target.value })
                      }
                      className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-muted mb-1">
                      Kogus
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(i, {
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-muted mb-1">
                      Ühik
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        updateLineItem(i, { unit: e.target.value })
                      }
                      className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="h">h</option>
                      <option value="m²">m²</option>
                      <option value="tk">tk</option>
                      <option value="jm">jm</option>
                      <option value="km">km</option>
                      <option value="päev">päev</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-muted mb-1">
                      Ühikuhind (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(i, {
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-muted mb-1">
                      Kokku
                    </label>
                    <div className="px-2 py-1.5 text-sm font-mono font-medium bg-surface rounded">
                      €{item.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => removeLineItem(i)}
                      className="text-muted hover:text-error text-lg px-2 py-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {lineItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Vahesumma:</span>
                  <span className="font-mono">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                  <span>Kokku:</span>
                  <span className="font-mono">€{subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted text-right">
                  KM lisatakse salvestamisel vastavalt profiili seadetele
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/invoices")}
          className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          {t("common.cancel")}
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving || !selectedClientId || lineItems.length === 0}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
