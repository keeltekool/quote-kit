import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">QuoteKit dashboard — coming soon.</p>
    </div>
  );
}
