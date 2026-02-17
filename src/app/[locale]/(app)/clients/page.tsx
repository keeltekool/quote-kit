"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

type Client = {
  id: string;
  clientType: string;
  name: string;
  registryCode: string | null;
  kmkrNumber: string | null;
  address: string;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  isEinvoiceRecipient: boolean;
  notes: string | null;
};

type ClientForm = {
  clientType: string;
  name: string;
  registryCode: string;
  kmkrNumber: string;
  address: string;
  email: string;
  phone: string;
  contactPerson: string;
  notes: string;
};

type AriregisterResult = {
  arilesnimi: string;
  ariregistrikood: string;
  aadress?: string;
};

const emptyForm: ClientForm = {
  clientType: "b2b",
  name: "",
  registryCode: "",
  kmkrNumber: "",
  address: "",
  email: "",
  phone: "",
  contactPerson: "",
  notes: "",
};

export default function ClientsPage() {
  const t = useTranslations();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Äriregister autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AriregisterResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    const { data } = await res.json();
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const update = (fields: Partial<ClientForm>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  // Äriregister search with debounce
  useEffect(() => {
    if (searchQuery.length < 2 || form.clientType !== "b2b") {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/ariregister/search?q=${encodeURIComponent(searchQuery)}`
        );
        const { data } = await res.json();
        setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, form.clientType]);

  const selectCompany = (result: AriregisterResult) => {
    update({
      name: result.arilesnimi,
      registryCode: result.ariregistrikood,
      address: result.aadress || "",
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Client) => {
    setForm({
      clientType: c.clientType,
      name: c.name,
      registryCode: c.registryCode || "",
      kmkrNumber: c.kmkrNumber || "",
      address: c.address,
      email: c.email || "",
      phone: c.phone || "",
      contactPerson: c.contactPerson || "",
      notes: c.notes || "",
    });
    setEditingId(c.id);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Cannot delete");
      return;
    }
    fetchClients();
  };

  const canSave = form.name && form.address;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {t("clients.new")}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-border rounded-xl">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? t("common.edit") : t("clients.new")}
          </h2>

          {/* Client type toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => update({ clientType: "b2b" })}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                form.clientType === "b2b"
                  ? "bg-blue-600 text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {t("clients.b2b")}
            </button>
            <button
              onClick={() =>
                update({
                  clientType: "b2c",
                  registryCode: "",
                  kmkrNumber: "",
                  contactPerson: "",
                })
              }
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                form.clientType === "b2c"
                  ? "bg-blue-600 text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {t("clients.b2c")}
            </button>
          </div>

          {/* Äriregister search (B2B only) */}
          {form.clientType === "b2b" && !editingId && (
            <div className="mb-4 relative">
              <label className="block text-sm font-medium mb-1">
                {t("clients.searchCompany")}
              </label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Otsi Äriregistrist..."
              />
              {searching && (
                <p className="text-xs text-muted mt-1">Otsin...</p>
              )}
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => selectCompany(r)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface border-b border-border last:border-0"
                    >
                      <span className="font-medium">{r.arilesnimi}</span>
                      <span className="text-muted ml-2">
                        ({r.ariregistrikood})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("clients.name")} *
              </label>
              <input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            {form.clientType === "b2b" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("clients.registryCode")}
                </label>
                <input
                  value={form.registryCode}
                  onChange={(e) => update({ registryCode: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
            <div className={form.clientType === "b2c" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1">
                {t("clients.address")} *
              </label>
              <input
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            {form.clientType === "b2b" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("clients.kmkr")}
                </label>
                <input
                  value={form.kmkrNumber}
                  onChange={(e) =>
                    update({ kmkrNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="EE123456789"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("clients.email")}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("clients.phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            {form.clientType === "b2b" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("clients.contactPerson")}
                </label>
                <input
                  value={form.contactPerson}
                  onChange={(e) => update({ contactPerson: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Märkmed</label>
              <input
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-error">{error}</p>
          )}

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

      {/* Client list */}
      {clients.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted">
          <p>Kliente pole veel lisatud.</p>
          <button
            onClick={openNew}
            className="mt-3 text-blue-600 font-medium hover:underline"
          >
            + {t("clients.new")}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-medium">
                  {t("clients.name")}
                </th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">
                  {t("clients.registryCode")}
                </th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">
                  {t("clients.email")}
                </th>
                <th className="text-center px-4 py-2.5 font-medium w-20">
                  Tüüp
                </th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-surface/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{c.name}</span>
                    {c.contactPerson && (
                      <span className="text-muted text-xs block">
                        {c.contactPerson}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted">
                    {c.registryCode || "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted">
                    {c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        c.clientType === "b2b"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {c.clientType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-muted hover:text-foreground mr-3"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
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
      )}
    </div>
  );
}
