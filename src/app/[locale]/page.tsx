import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

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
          <SignInButton mode="modal">
            <button className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Alusta / Get Started
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {t("nav.dashboard")}
          </Link>
        </SignedIn>
      </div>
    </div>
  );
}
