"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

type Client = {
  id: string;
  name: string;
  clientType: string;
  registryCode: string | null;
  address: string;
};

type CatalogService = {
  id: string;
  nameEt: string;
  nameEn: string | null;
  category: string;
  unitPrice: string;
  unit: string;
  isMaterial: boolean;
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

export default function NewQuotePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from hanked (procurement) flow
  const prefillClientId = searchParams.get("clientId") || "";
  const hankeRef = searchParams.get("hankeRef") || "";
  const hankeTitle = searchParams.get("hankeTitle") || "";

  // Step state — skip to step 2 if client pre-selected from hanked
  const [step, setStep] = useState(prefillClientId ? 2 : 1);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Client selection
  const [selectedClientId, setSelectedClientId] = useState(prefillClientId);

  // Step 2: Job description + AI
  const [jobDescription, setJobDescription] = useState(
    hankeTitle ? `${hankeTitle}${hankeRef ? ` (Hanke viide: ${hankeRef})` : ""}` : ""
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [aiThinking, setAiThinking] = useState("");
  const [aiNotes, setAiNotes] = useState("");

  // Step 3: Review line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Load clients and services
  const fetchData = useCallback(async () => {
    const [clientsRes, servicesRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/services"),
    ]);
    const clientsData = await clientsRes.json();
    const servicesData = await servicesRes.json();
    setClients(clientsData.data || []);
    setServices(
      (servicesData.data || []).filter(
        (s: CatalogService & { isActive: boolean }) => s.isActive
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle service selection for quick-add
  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // AI Generate
  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    setGenerating(true);
    setAiThinking("Analüüsin töökirjeldust...");
    setLineItems([]);
    setAiNotes("");

    try {
      const res = await fetch("/api/quotes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          jobDescription,
          selectedServiceIds,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          switch (data.type) {
            case "thinking":
              setAiThinking(data.text);
              break;
            case "line_item":
              setLineItems((prev) => [...prev, data.item]);
              setAiThinking("");
              break;
            case "notes":
              setAiNotes(data.text);
              break;
            case "done":
              setAiThinking("");
              break;
            case "error":
              setAiThinking("");
              alert(data.message);
              break;
          }
        }
      }

      setStep(3);
    } catch (err) {
      alert("AI generation failed");
    }

    setGenerating(false);
  };

  // Add manual line item
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

  // Update line item
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

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Add selected services directly as line items (skip AI)
  const addServicesDirectly = () => {
    const newItems: LineItem[] = selectedServiceIds
      .map((id) => {
        const svc = services.find((s) => s.id === id);
        if (!svc) return null;
        const price = parseFloat(svc.unitPrice);
        return {
          description: svc.nameEt,
          quantity: 1,
          unit: svc.unit,
          unitPrice: price,
          total: price,
          isMaterial: svc.isMaterial,
          catalogServiceId: svc.id,
        };
      })
      .filter(Boolean) as LineItem[];
    setLineItems((prev) => [...prev, ...newItems]);
    setSelectedServiceIds([]);
    setStep(3);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  // Save quote
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          lineItems,
          notes: notes || aiNotes || null,
          aiJobDescription: jobDescription || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save");
        setSaving(false);
        return;
      }

      router.push("/quotes");
    } catch {
      alert("Save failed");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("quotes.new")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  // Group services by category for the picker
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
        <h1 className="text-2xl font-bold">{t("quotes.new")}</h1>
        <button
          onClick={() => router.push("/quotes")}
          className="text-sm text-muted hover:text-foreground"
        >
          {t("common.cancel")}
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full ${
              s <= step ? "bg-fjord-700" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* ─── Step 1: Select client ──────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            1. {t("quotes.client")}
          </h2>

          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <p>Lisa esmalt klient.</p>
              <button
                onClick={() => router.push("/clients")}
                className="mt-2 text-fjord-700 font-medium hover:underline"
              >
                + {t("clients.new")}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedClientId === c.id
                        ? "border-fjord-700 bg-fjord-50"
                        : "border-border hover:bg-surface"
                    }`}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.registryCode && (
                      <span className="text-muted text-xs ml-2">
                        ({c.registryCode})
                      </span>
                    )}
                    <span
                      className={`ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
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

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedClientId}
                  className="px-6 py-2 text-sm font-medium text-white bg-fjord-700 rounded-lg hover:bg-fjord-800 disabled:opacity-50 transition-colors"
                >
                  {t("common.next")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Step 2: Describe job + AI ──────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              2. {t("quotes.describeJob")}
            </h2>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-fjord-700 focus:ring-2 focus:ring-fjord-700/20 outline-none resize-none"
              placeholder={t("quotes.describeJobPlaceholder")}
            />

            {/* Quick-select services from catalog */}
            {Object.keys(servicesByCategory).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  Vali teenuseid kataloogist (valikuline):
                </p>
                {Object.entries(servicesByCategory).map(([cat, svcs]) => (
                  <div key={cat} className="mb-3">
                    <p className="text-xs text-muted uppercase tracking-wide mb-1">
                      {cat}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {svcs.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            selectedServiceIds.includes(s.id)
                              ? "border-fjord-700 bg-fjord-50 text-fjord-700"
                              : "border-border text-muted hover:text-foreground"
                          }`}
                        >
                          {s.nameEt} — €
                          {parseFloat(s.unitPrice).toFixed(2)}/{s.unit}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                {t("common.back")}
              </button>
              <div className="flex-1" />

              {selectedServiceIds.length > 0 && !jobDescription.trim() && (
                <button
                  onClick={addServicesDirectly}
                  className="px-4 py-2 text-sm font-medium text-fjord-700 border border-fjord-700 rounded-lg hover:bg-fjord-50 transition-colors"
                >
                  Lisa {selectedServiceIds.length} teenust →
                </button>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !jobDescription.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-fjord-700 rounded-lg hover:bg-fjord-800 disabled:opacity-50 transition-colors"
              >
                {generating
                  ? t("quotes.generating")
                  : t("quotes.generateWithAI")}
              </button>
            </div>

            {/* AI thinking indicator */}
            {aiThinking && (
              <div className="mt-4 p-3 bg-fjord-50 rounded-lg text-sm text-fjord-700 animate-pulse">
                {aiThinking}
              </div>
            )}

            {/* Streaming line items preview */}
            {generating && lineItems.length > 0 && (
              <div className="mt-4 space-y-2">
                {lineItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-fjord-50 rounded-lg text-sm flex justify-between animate-fade-in"
                  >
                    <span>{item.description}</span>
                    <span className="font-mono">
                      €{item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Step 3: Review & Edit line items ───────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">3. Pakkumise read</h2>
              <button
                onClick={addLineItem}
                className="text-sm text-fjord-700 font-medium hover:underline"
              >
                + {t("quotes.addLineItem")}
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p>Lisa pakkumise read.</p>
                <button
                  onClick={addLineItem}
                  className="mt-2 text-fjord-700 font-medium hover:underline"
                >
                  + {t("quotes.addLineItem")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 border border-border rounded-lg"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      {/* Description */}
                      <div className="md:col-span-5">
                        <label className="block text-xs text-muted mb-1">
                          Kirjeldus
                        </label>
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(i, {
                              description: e.target.value,
                            })
                          }
                          className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-fjord-700"
                        />
                      </div>

                      {/* Qty */}
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
                          className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-fjord-700"
                        />
                      </div>

                      {/* Unit */}
                      <div className="md:col-span-1">
                        <label className="block text-xs text-muted mb-1">
                          Ühik
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateLineItem(i, { unit: e.target.value })
                          }
                          className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-fjord-700"
                        >
                          <option value="h">h</option>
                          <option value="m²">m²</option>
                          <option value="tk">tk</option>
                          <option value="jm">jm</option>
                          <option value="km">km</option>
                          <option value="päev">päev</option>
                        </select>
                      </div>

                      {/* Unit price */}
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
                          className="w-full rounded border border-border px-2 py-1.5 text-sm outline-none focus:border-fjord-700"
                        />
                      </div>

                      {/* Total (readonly) */}
                      <div className="md:col-span-2">
                        <label className="block text-xs text-muted mb-1">
                          Kokku
                        </label>
                        <div className="px-2 py-1.5 text-sm font-mono font-medium bg-surface rounded">
                          €{item.total.toFixed(2)}
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="md:col-span-1 flex items-end">
                        <button
                          onClick={() => removeLineItem(i)}
                          className="text-muted hover:text-error text-lg px-2 py-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Material toggle */}
                    <div className="mt-2">
                      <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isMaterial}
                          onChange={(e) =>
                            updateLineItem(i, {
                              isMaterial: e.target.checked,
                            })
                          }
                          className="rounded border-border"
                        />
                        Materjal
                      </label>
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
                      <span className="font-mono">
                        €{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                      <span>Kokku:</span>
                      <span className="font-mono">
                        €{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted text-right">
                      KM lisatakse salvestamisel vastavalt profiili seadetele
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white border border-border rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              Märkmed (valikuline)
            </label>
            <textarea
              value={notes || aiNotes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-fjord-700 focus:ring-2 focus:ring-fjord-700/20 outline-none resize-none"
              placeholder="Lisainfo, tähelepanekud..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t("common.back")}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={saving || lineItems.length === 0}
              className="px-6 py-2.5 text-sm font-medium text-white bg-fjord-700 rounded-lg hover:bg-fjord-800 disabled:opacity-50 transition-colors"
            >
              {saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
