"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

type Service = {
  id: string;
  nameEt: string;
  nameEn: string | null;
  category: string;
  unitPrice: string;
  unit: string;
  description: string | null;
  isMaterial: boolean;
  estimatedMinutes: number | null;
  isActive: boolean;
};

type ServiceForm = {
  nameEt: string;
  nameEn: string;
  category: string;
  unitPrice: string;
  unit: string;
  description: string;
  isMaterial: boolean;
  estimatedMinutes: string;
};

const UNITS = ["h", "m2", "tk", "jm", "km", "paev"] as const;

const emptyForm: ServiceForm = {
  nameEt: "",
  nameEn: "",
  category: "",
  unitPrice: "",
  unit: "h",
  description: "",
  isMaterial: false,
  estimatedMinutes: "",
};

export default function ServicesPage() {
  const t = useTranslations();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/services");
    const { data } = await res.json();
    setServices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const update = (fields: Partial<ServiceForm>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setForm({
      nameEt: s.nameEt,
      nameEn: s.nameEn || "",
      category: s.category,
      unitPrice: s.unitPrice,
      unit: s.unit,
      description: s.description || "",
      isMaterial: s.isMaterial,
      estimatedMinutes: s.estimatedMinutes?.toString() || "",
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editingId ? `/api/services/${editingId}` : "/api/services";
    const method = editingId ? "PUT" : "POST";

    const payload = {
      ...form,
      unitPrice: form.unitPrice,
      estimatedMinutes: form.estimatedMinutes
        ? parseInt(form.estimatedMinutes)
        : null,
      isActive: true,
    };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    fetchServices();
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  const activeServices = services.filter((s) => s.isActive);
  const archivedServices = services.filter((s) => !s.isActive);

  // Group by category
  const grouped = activeServices.reduce(
    (acc, s) => {
      const cat = s.category || "Muu";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  const canSave = form.nameEt && form.category && form.unitPrice && form.unit;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("services.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("services.title")}</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {t("services.new")}
        </button>
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? t("common.edit") : t("services.new")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("services.name")} (ET) *
              </label>
              <input
                value={form.nameEt}
                onChange={(e) => update({ nameEt: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="nt. Torude vahetus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("services.name")} (EN)
              </label>
              <input
                value={form.nameEn}
                onChange={(e) => update({ nameEn: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="e.g. Pipe replacement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("services.category")} *
              </label>
              <input
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="nt. Torustik"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  {t("services.unitPrice")} (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => update({ unitPrice: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="80.00"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">
                  {t("services.unit")} *
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => update({ unit: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t(`services.units.${u}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                {t("services.description")}
              </label>
              <input
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isMaterial}
                  onChange={(e) => update({ isMaterial: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-blue-600"
                />
                <span className="text-sm">{t("services.material")}</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ajakulu (min)
              </label>
              <input
                type="number"
                value={form.estimatedMinutes}
                onChange={(e) => update({ estimatedMinutes: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="60"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      )}

      {/* Services list grouped by category */}
      {activeServices.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted">
          <p>Teenuseid pole veel lisatud.</p>
          <button
            onClick={openNew}
            className="mt-3 text-blue-600 font-medium hover:underline"
          >
            + {t("services.new")}
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              {category}
            </h3>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left px-4 py-2.5 font-medium">
                      {t("services.name")}
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      {t("services.unitPrice")}
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium">
                      {t("services.unit")}
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium w-20">
                      Tüüp
                    </th>
                    <th className="px-4 py-2.5 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-surface/50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium">{s.nameEt}</span>
                        {s.nameEn && (
                          <span className="text-muted ml-2 text-xs">
                            ({s.nameEn})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        €{parseFloat(s.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t(`services.units.${s.unit}`)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            s.isMaterial
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {s.isMaterial
                            ? t("services.material")
                            : t("services.labor")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-muted hover:text-foreground mr-3"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => handleArchive(s.id)}
                          className="text-muted hover:text-error"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Archived toggle */}
      {archivedServices.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm text-muted hover:text-foreground"
          >
            {showArchived ? "Peida" : "Näita"} arhiveeritud (
            {archivedServices.length})
          </button>
          {showArchived && (
            <div className="mt-2 opacity-60">
              {archivedServices.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 px-4 text-sm"
                >
                  <span className="line-through">{s.nameEt}</span>
                  <span className="text-muted">
                    €{parseFloat(s.unitPrice).toFixed(2)} / {t(`services.units.${s.unit}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
