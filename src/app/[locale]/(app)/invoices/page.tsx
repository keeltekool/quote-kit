import { useTranslations } from "next-intl";

export default function InvoicesPage() {
  const t = useTranslations("invoices");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">Invoices list — coming soon.</p>
    </div>
  );
}
