"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const TRADE_TYPES = [
  "electrical",
  "plumbing",
  "hvac",
  "gas",
  "painting",
  "renovation",
  "other",
] as const;

const REGULATED_TRADES = ["electrical", "plumbing", "hvac", "gas"];

type FormData = {
  // Step 1: Company basics
  companyName: string;
  registryCode: string;
  address: string;
  phone: string;
  email: string;
  // Step 2: VAT
  isVatRegistered: boolean;
  kmkrNumber: string;
  // Step 3: Trade
  tradeType: string;
  isMtrRegistered: boolean;
  mtrReference: string;
  // Step 4: Bank
  iban: string;
  bankName: string;
  // Step 5: Defaults
  defaultPaymentDays: number;
  defaultValidityDays: number;
  documentLanguage: string;
  accentColor: string;
};

const initialFormData: FormData = {
  companyName: "",
  registryCode: "",
  address: "",
  phone: "",
  email: "",
  isVatRegistered: false,
  kmkrNumber: "",
  tradeType: "",
  isMtrRegistered: false,
  mtrReference: "",
  iban: "",
  bankName: "",
  defaultPaymentDays: 14,
  defaultValidityDays: 14,
  documentLanguage: "et",
  accentColor: "#2563EB",
};

const STEPS = [
  "step1", // Company details
  "step2", // VAT
  "step3", // Trade type
  "step4", // Bank details
  "step5", // Defaults
] as const;

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (fields: Partial<FormData>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!(
          form.companyName &&
          form.registryCode &&
          form.address &&
          form.phone &&
          form.email
        );
      case 1:
        return !form.isVatRegistered || !!form.kmkrNumber;
      case 2:
        return !!form.tradeType;
      case 3:
        return !!(form.iban && form.bankName);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const isRegulatedTrade = REGULATED_TRADES.includes(form.tradeType);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-border p-8">
        <h1 className="text-2xl font-bold mb-1">
          {t("onboarding.welcome")}
        </h1>
        <p className="text-muted text-sm mb-6">{t("onboarding.subtitle")}</p>

        {/* Step indicators */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-blue-600" : "bg-border"
              }`}
            />
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">
          {t(`onboarding.${STEPS[step]}`)}
        </h2>

        {/* Step 1: Company basics */}
        {step === 0 && (
          <div className="space-y-4">
            <Field
              label={t("profile.companyName")}
              value={form.companyName}
              onChange={(v) => update({ companyName: v })}
              required
            />
            <Field
              label={t("profile.registryCode")}
              value={form.registryCode}
              onChange={(v) => update({ registryCode: v })}
              placeholder="12345678"
              required
            />
            <Field
              label={t("profile.address")}
              value={form.address}
              onChange={(v) => update({ address: v })}
              required
            />
            <Field
              label={t("profile.phone")}
              value={form.phone}
              onChange={(v) => update({ phone: v })}
              type="tel"
              required
            />
            <Field
              label={t("profile.email")}
              value={form.email}
              onChange={(v) => update({ email: v })}
              type="email"
              required
            />
          </div>
        )}

        {/* Step 2: VAT */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVatRegistered}
                onChange={(e) =>
                  update({
                    isVatRegistered: e.target.checked,
                    kmkrNumber: e.target.checked ? form.kmkrNumber : "",
                  })
                }
                className="h-5 w-5 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">
                {t("profile.vatRegistered")}
              </span>
            </label>
            {form.isVatRegistered && (
              <Field
                label={t("profile.kmkrNumber")}
                value={form.kmkrNumber}
                onChange={(v) => update({ kmkrNumber: v.toUpperCase() })}
                placeholder="EE123456789"
                required
              />
            )}
            {!form.isVatRegistered && (
              <p className="text-sm text-muted p-3 bg-surface rounded-lg">
                Kui Sa ei ole käibemaksukohustuslane, siis arvetel ja
                pakkumistel käibemaksu ei kajastu.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Trade type */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("profile.tradeType")} *
              </label>
              <select
                value={form.tradeType}
                onChange={(e) =>
                  update({
                    tradeType: e.target.value,
                    isMtrRegistered: false,
                    mtrReference: "",
                  })
                }
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">— Vali —</option>
                {TRADE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`tradeTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            {isRegulatedTrade && (
              <>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isMtrRegistered}
                    onChange={(e) =>
                      update({ isMtrRegistered: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    {t("profile.mtrRegistered")}
                  </span>
                </label>
                {form.isMtrRegistered && (
                  <Field
                    label={t("profile.mtrReference")}
                    value={form.mtrReference}
                    onChange={(v) => update({ mtrReference: v })}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: Bank details */}
        {step === 3 && (
          <div className="space-y-4">
            <Field
              label={t("profile.iban")}
              value={form.iban}
              onChange={(v) => update({ iban: v.toUpperCase() })}
              placeholder="EE123456789012345678"
              required
            />
            <Field
              label={t("profile.bankName")}
              value={form.bankName}
              onChange={(v) => update({ bankName: v })}
              placeholder="Swedbank / SEB / LHV / ..."
              required
            />
          </div>
        )}

        {/* Step 5: Defaults */}
        {step === 4 && (
          <div className="space-y-4">
            <Field
              label={t("profile.paymentDays")}
              value={form.defaultPaymentDays.toString()}
              onChange={(v) =>
                update({ defaultPaymentDays: parseInt(v) || 14 })
              }
              type="number"
            />
            <Field
              label={t("profile.validityDays")}
              value={form.defaultValidityDays.toString()}
              onChange={(v) =>
                update({ defaultValidityDays: parseInt(v) || 14 })
              }
              type="number"
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("profile.documentLanguage")}
              </label>
              <select
                value={form.documentLanguage}
                onChange={(e) =>
                  update({ documentLanguage: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="et">Eesti keel</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("profile.accentColor")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => update({ accentColor: e.target.value })}
                  className="h-10 w-10 rounded border border-border cursor-pointer"
                />
                <span className="text-sm text-muted">{form.accentColor}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-error bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground disabled:opacity-0 transition-colors"
          >
            {t("common.back")}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.next")}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !canProceed()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t("common.loading") : t("onboarding.complete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}
