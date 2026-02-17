"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Profile = {
  id: string;
  companyName: string;
  registryCode: string;
  address: string;
  phone: string;
  email: string;
  isVatRegistered: boolean;
  kmkrNumber: string | null;
  tradeType: string;
  isMtrRegistered: boolean;
  mtrReference: string | null;
  iban: string;
  bankName: string;
  logoUrl: string | null;
  defaultPaymentDays: number;
  defaultValidityDays: number;
  defaultWarrantyB2c: string | null;
  defaultWarrantyB2b: string | null;
  invoicePrefix: string | null;
  quotePrefix: string | null;
  documentLanguage: string;
  accentColor: string | null;
};

const tradeTypes = [
  "electrical",
  "plumbing",
  "hvac",
  "gas",
  "painting",
  "renovation",
  "other",
];

const regulatedTrades = ["electrical", "plumbing", "hvac", "gas"];

export default function SettingsPage() {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "defaults">(
    "profile"
  );

  // Form state
  const [form, setForm] = useState({
    companyName: "",
    registryCode: "",
    address: "",
    phone: "",
    email: "",
    isVatRegistered: false,
    kmkrNumber: "",
    tradeType: "other",
    isMtrRegistered: false,
    mtrReference: "",
    iban: "",
    bankName: "",
    defaultPaymentDays: 14,
    defaultValidityDays: 14,
    defaultWarrantyB2c: "24 kuud tööde teostamise kuupäevast",
    defaultWarrantyB2b: "Garantiitingimused lepitakse kokku eraldi",
    invoicePrefix: "",
    quotePrefix: "HP",
    documentLanguage: "et",
    accentColor: "#2563EB",
  });

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const { data } = await res.json();
    if (data) {
      setProfile(data);
      setForm({
        companyName: data.companyName,
        registryCode: data.registryCode,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isVatRegistered: data.isVatRegistered,
        kmkrNumber: data.kmkrNumber || "",
        tradeType: data.tradeType,
        isMtrRegistered: data.isMtrRegistered,
        mtrReference: data.mtrReference || "",
        iban: data.iban,
        bankName: data.bankName,
        defaultPaymentDays: data.defaultPaymentDays,
        defaultValidityDays: data.defaultValidityDays,
        defaultWarrantyB2c: data.defaultWarrantyB2c || "",
        defaultWarrantyB2b: data.defaultWarrantyB2b || "",
        invoicePrefix: data.invoicePrefix || "",
        quotePrefix: data.quotePrefix || "HP",
        documentLanguage: data.documentLanguage,
        accentColor: data.accentColor || "#2563EB",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const { data } = await res.json();
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Salvestamine ebaõnnestus");
    }
    setSaving(false);
  };

  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setLogoUrl(profile.logoUrl);
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Fail on liiga suur. Maksimaalselt 2MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/profile/logo", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { data } = await res.json();
      setLogoUrl(data.logoUrl);
    } else {
      alert("Logo üleslaadimine ebaõnnestus");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoDelete = async () => {
    setUploading(true);
    const res = await fetch("/api/profile/logo", { method: "DELETE" });
    if (res.ok) setLogoUrl(null);
    setUploading(false);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="mt-4 text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="mt-4 text-muted">Profiil puudub. Mine seadistamisesse.</p>
      </div>
    );
  }

  const showMtr = regulatedTrades.includes(form.tradeType);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">
              Salvestatud
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "profile"
              ? "bg-blue-600 text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {t("settings.profile")}
        </button>
        <button
          onClick={() => setActiveTab("defaults")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "defaults"
              ? "bg-blue-600 text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {t("settings.defaults")}
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Company info */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">
              {t("profile.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.companyName")} *
                </label>
                <input
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.registryCode")} *
                </label>
                <input
                  value={form.registryCode}
                  onChange={(e) => updateField("registryCode", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  {t("profile.address")} *
                </label>
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.phone")} *
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.email")} *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Logo</h2>
            <div className="flex items-center gap-6">
              {logoUrl ? (
                <div className="relative w-24 h-24 rounded-lg border border-border overflow-hidden bg-surface">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? "Laadin..."
                    : logoUrl
                      ? "Vaheta logo"
                      : "Lae logo üles"}
                </button>
                {logoUrl && (
                  <button
                    onClick={handleLogoDelete}
                    disabled={uploading}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    Eemalda logo
                  </button>
                )}
                <p className="text-xs text-muted">
                  PNG, JPEG, WebP, SVG. Maks. 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* VAT */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">
              {t("profile.vatRegistered")}
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVatRegistered}
                onChange={(e) =>
                  updateField("isVatRegistered", e.target.checked)
                }
                className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Ettevõte on käibemaksukohustuslane</span>
            </label>
            {form.isVatRegistered && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  {t("profile.kmkrNumber")} *
                </label>
                <input
                  value={form.kmkrNumber}
                  onChange={(e) => updateField("kmkrNumber", e.target.value)}
                  placeholder="EE123456789"
                  className="w-full max-w-xs rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Trade type */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">
              {t("profile.tradeType")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {tradeTypes.map((tt) => (
                <button
                  key={tt}
                  onClick={() => updateField("tradeType", tt)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    form.tradeType === tt
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  {t(`tradeTypes.${tt}`)}
                </button>
              ))}
            </div>

            {showMtr && (
              <div className="mt-4 pt-4 border-t border-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isMtrRegistered}
                    onChange={(e) =>
                      updateField("isMtrRegistered", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{t("profile.mtrRegistered")}</span>
                </label>
                {form.isMtrRegistered && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">
                      {t("profile.mtrReference")}
                    </label>
                    <input
                      value={form.mtrReference}
                      onChange={(e) =>
                        updateField("mtrReference", e.target.value)
                      }
                      className="w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank details */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Pangaandmed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.iban")} *
                </label>
                <input
                  value={form.iban}
                  onChange={(e) => updateField("iban", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.bankName")} *
                </label>
                <input
                  value={form.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "defaults" && (
        <div className="space-y-4">
          {/* Document defaults */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">
              Dokumendi vaikeväärtused
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.paymentDays")}
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={form.defaultPaymentDays}
                  onChange={(e) =>
                    updateField(
                      "defaultPaymentDays",
                      parseInt(e.target.value) || 14
                    )
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.validityDays")}
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={form.defaultValidityDays}
                  onChange={(e) =>
                    updateField(
                      "defaultValidityDays",
                      parseInt(e.target.value) || 14
                    )
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  {t("profile.warrantyB2C")}
                </label>
                <input
                  value={form.defaultWarrantyB2c}
                  onChange={(e) =>
                    updateField("defaultWarrantyB2c", e.target.value)
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  {t("profile.warrantyB2B")}
                </label>
                <input
                  value={form.defaultWarrantyB2b}
                  onChange={(e) =>
                    updateField("defaultWarrantyB2b", e.target.value)
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Number prefixes */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Numbrite eesliited</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.quotePrefix")}
                </label>
                <input
                  value={form.quotePrefix}
                  onChange={(e) => updateField("quotePrefix", e.target.value)}
                  placeholder="HP"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-muted mt-1">
                  Nt: {form.quotePrefix || "HP"}-001
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.invoicePrefix")}
                </label>
                <input
                  value={form.invoicePrefix}
                  onChange={(e) => updateField("invoicePrefix", e.target.value)}
                  placeholder="2026"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-muted mt-1">
                  Nt: {form.invoicePrefix || "2026"}-001
                </p>
              </div>
            </div>
          </div>

          {/* Language & appearance */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Keel ja välimus</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.documentLanguage")}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateField("documentLanguage", "et")}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      form.documentLanguage === "et"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-border hover:bg-surface"
                    }`}
                  >
                    Eesti
                  </button>
                  <button
                    onClick={() => updateField("documentLanguage", "en")}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      form.documentLanguage === "en"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-border hover:bg-surface"
                    }`}
                  >
                    English
                  </button>
                </div>
                <p className="text-xs text-muted mt-1">
                  Keel, milles genereeritakse dokumendid
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("profile.accentColor")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    value={form.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="w-28 rounded-lg border border-border px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <div
                    className="h-10 flex-1 rounded-lg"
                    style={{ backgroundColor: form.accentColor }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  Kasutatakse dokumentide päises
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
