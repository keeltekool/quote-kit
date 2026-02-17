import { useTranslations } from "next-intl";

export default function QuotesPage() {
  const t = useTranslations("quotes");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">Quotes list — coming soon.</p>
    </div>
  );
}
