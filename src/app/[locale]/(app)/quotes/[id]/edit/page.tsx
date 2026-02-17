"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import type { LineItem } from "@/lib/db/schema";

type CatalogService = {
  id: string;
  nameEt: string;
  unitPrice: string;
  unit: string;
  isMaterial: boolean;
  category: string;
  isActive: boolean;
};

type Quote = {
  id: string;
  quoteNumber: string;
  status: string;
  clientSnapshot: { name: string };
  lineItems: LineItem[];
  notes: string | null;
  validityDays: number;
  paymentTermsDays: number;
  warrantyText: string | null;
  materialClause: string | null;
};

export default function EditQuotePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [validityDays, setValidityDays] = useState(14);
  const [paymentTermsDays, setPaymentTermsDays] = useState(14);

  const fetchData = useCallback(async () => {
    const [quoteRes, servicesRes] = await Promise.all([
      fetch(`/api/quotes/${params.id}`),
      fetch("/api/services"),
    ]);

    if (!quoteRes.ok) {
      router.push("/quotes");
      return;
    }

    const { data: quoteData } = await quoteRes.json();
    if (quoteData.status !== "draft") {
      router.push(`/quotes/${params.id}`);
      return;
    }

    setQuote(quoteData);
    setLineItems(quoteData.lineItems);
    setNotes(quoteData.notes || "");
    setValidityDays(quoteData.validityDays);
    setPaymentTermsDays(quoteData.paymentTermsDays);

    const servicesData = await servicesRes.json();
    setServices(
      (servicesData.data || []).filter((s: CatalogService) => s.isActive)
    );

    setLoading(false);
  }, [params.id, router]);

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
        catalogServiceId: undefined,
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
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems,
          notes: notes || null,
          validityDays,
          paymentTermsDays,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Salvestamine ebaõnnestus");
        setSaving(false);
        return;
      }

      router.push(`/quotes/${params.id}`);
    } catch {
      alert("Salvestamine ebaõnnestus");
      setSaving(false);
    }
  };

  if (loading || !quote) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("quotes.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/quotes/${quote.id}`)}
            className="text-sm text-muted hover:text-foreground mb-2 inline-block"
          >
            &larr; {quote.quoteNumber}
          </button>
          <h1 className="text-2xl font-bold">
            {t("common.edit")} {quote.quoteNumber}
          </h1>
          <p className="text-sm text-muted mt-1">
            {quote.clientSnapshot.name}
          </p>
        </div>
        <button
          onClick={() => router.push(`/quotes/${quote.id}`)}
          className="text-sm text-muted hover:text-foreground"
        >
          {t("common.cancel")}
        </button>
      </div>

      {/* Terms */}
      <div className="bg-white border border-border rounded-xl p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("profile.validityDays")}
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={validityDays}
              onChange={(e) =>
                setValidityDays(parseInt(e.target.value) || 14)
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("profile.paymentDays")}
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={paymentTermsDays}
              onChange={(e) =>
                setPaymentTermsDays(parseInt(e.target.value) || 14)
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Märkmed
            </label>
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
          <h2 className="text-sm font-semibold">Pakkumise read</h2>
          <button
            onClick={addLineItem}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            + {t("quotes.addLineItem")}
          </button>
        </div>

        {/* Quick-add from catalog */}
        {services.length > 0 && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs text-muted mb-2">Lisa kataloogist:</p>
            <div className="flex flex-wrap gap-1.5">
              {services.slice(0, 12).map((s) => (
                <button
                  key={s.id}
                  onClick={() => addFromCatalog(s)}
                  className="px-2 py-1 text-xs rounded border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  {s.nameEt} — &euro;{parseFloat(s.unitPrice).toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}

        {lineItems.length === 0 ? (
          <div className="text-center py-6 text-muted text-sm">
            <p>Lisa pakkumise read.</p>
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
                      Ühikuhind (&euro;)
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
                      &euro;{item.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => removeLineItem(i)}
                      className="text-muted hover:text-error text-lg px-2 py-1"
                    >
                      &times;
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
                  <span className="font-mono">&euro;{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                  <span>Kokku:</span>
                  <span className="font-mono">&euro;{subtotal.toFixed(2)}</span>
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
          onClick={() => router.push(`/quotes/${quote.id}`)}
          className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          {t("common.cancel")}
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving || lineItems.length === 0}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
