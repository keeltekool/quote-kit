import { useTranslations } from "next-intl";

export default function ClientsPage() {
  const t = useTranslations("clients");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">Clients list — coming soon.</p>
    </div>
  );
}
