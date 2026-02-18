import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("common.appName")}
        </h1>
        <p className="text-lg text-muted max-w-md mx-auto">
          {t("onboarding.subtitle")}
        </p>

        <SignedOut>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-lg bg-fjord-700 px-6 py-3 text-sm font-medium text-white hover:bg-fjord-800 transition-colors"
          >
            Alusta / Get Started
          </Link>
        </SignedOut>

        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-fjord-700 px-6 py-3 text-sm font-medium text-white hover:bg-fjord-800 transition-colors"
          >
            {t("nav.dashboard")}
          </Link>
        </SignedIn>
      </div>
    </div>
  );
}
