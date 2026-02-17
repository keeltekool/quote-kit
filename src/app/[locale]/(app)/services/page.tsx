import { useTranslations } from "next-intl";

export default function ServicesPage() {
  const t = useTranslations("services");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">Service catalog — coming soon.</p>
    </div>
  );
}
