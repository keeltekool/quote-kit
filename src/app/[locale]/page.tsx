import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { QuoteKitLogo } from "@/components/quotekit-logo";

// ─── Inline SVG Icons ──────────────────────────────────────────────────────

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" /><path d="M22 5h-4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function FileCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" />
      <path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-surface">

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <QuoteKitLogo variant="full" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Pakkumised ja arved, mis vastavad Eesti seadustele
          </h1>
          <p className="mt-5 text-lg text-muted max-w-xl mx-auto">
            Tee hinnapakkumine valmis 5 minutiga. Seaduslikud klauslid, käibemaks, garantii — kõik on juba sees.
          </p>
          <div className="mt-8">
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-lg bg-fjord-700 px-8 py-3.5 text-sm font-semibold text-white hover:bg-fjord-800 transition-colors"
              >
                Proovi tasuta
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-muted">Tasuta &middot; Ei küsi kaarti</p>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-fjord-700 px-8 py-3.5 text-sm font-semibold text-white hover:bg-fjord-800 transition-colors"
              >
                {t("nav.dashboard")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* ── 2. Problem Statement ────────────────────────────────────────── */}
      <section className="bg-fjord-50 border-y border-fjord-100 px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Tuttav olukord?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ProblemCard
              title="Pakkumine Excelis, arve Wordis"
              description="Kopeeri-kleebi kliendi andmed, arvuta käibemaks kalkulaatoriga, kujunda PDF käsitsi. Iga pakkumine võtab pool tundi."
            />
            <ProblemCard
              title="Mis see VÕS § 639 oli?"
              description="Tead, et pakkumisel peab mingi klausel olema, aga mis täpselt? Guugeldad iga kord uuesti."
            />
            <ProblemCard
              title="Arve number... 17? Või 18?"
              description="Nummerdamine läheb sassi, raamatupidaja helistab, nüüd on jama."
            />
          </div>
        </div>
      </section>

      {/* ── 3. Solution Pivot ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            QuoteKit teeb selle ära
          </h2>
          <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
            Üks koht pakkumiste ja arvete jaoks. Eesti seadused on juba sisse ehitatud — sina keskendud tööle.
          </p>
        </div>
      </section>

      {/* ── 4. Features Grid ────────────────────────────────────────────── */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={<SparklesIcon className="h-6 w-6 text-fjord-700" />}
            title="Teenuste kataloog"
            description="Sisesta oma eriala ja AI pakub välja teenused koos hindadega. Salvesta kataloog — järgmine pakkumine on ühe klikiga valmis."
          />
          <FeatureCard
            icon={<ClockIcon className="h-6 w-6 text-fjord-700" />}
            title="Pakkumine 5 minutiga"
            description="Vali klient, lisa read kataloogist. Käibemaks, garantii, VÕS klauslid — kõik arvutatakse ja lisatakse automaatselt."
          />
          <FeatureCard
            icon={<FileCheckIcon className="h-6 w-6 text-fjord-700" />}
            title="Pakkumisest arveks"
            description="Klient kinnitas? Vajuta nuppu ja arve on valmis. Kõik andmed kanduvad üle, number pannakse automaatselt."
          />
          <FeatureCard
            icon={<ShareIcon className="h-6 w-6 text-fjord-700" />}
            title="Jaga PDF-iga"
            description="Saada professionaalne PDF otse WhatsAppi, e-postiga või jagatava lingiga. Sinu logo ja andmed on peal."
          />
          <FeatureCard
            icon={<SearchIcon className="h-6 w-6 text-fjord-700" />}
            title="Äriregistri otsing"
            description="Sisesta registrikood — ettevõtte nimi, aadress ja KMKR ilmuvad automaatselt. Pole vaja midagi käsitsi otsida."
          />
          <FeatureCard
            icon={<CalculatorIcon className="h-6 w-6 text-fjord-700" />}
            title="Käibemaksu kontroll"
            description="KM-kohuslasele arvutab 24% automaatselt. Pole veel kohuslane? Süsteem jälgib 40 000 € piiri ja hoiatab ette."
          />
        </div>
      </section>

      {/* ── 5. Legal Compliance ─────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <ShieldCheckIcon className="h-10 w-10 text-fjord-700" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Seadused, millest sa ei pea aru saama
            </h2>
            <p className="mt-4 text-muted max-w-lg mx-auto">
              QuoteKit lisab õiged klauslid automaatselt. Sinu pakkumised ja arved vastavad Eesti õigusele ilma, et peaksid juristilt nõu küsima.
            </p>
          </div>
          <div className="space-y-4">
            <LawCard
              accentClass="border-fjord-700"
              abbr="VÕS"
              name="Võlaõigusseadus"
              description="Mittesiduv pakkumus (§ 16), lisatööde kokkulepe (§ 639), 2-aastane garantii (§ 642), tarbija taganemisõigus (§ 46–49) — igale pakkumisele automaatselt."
            />
            <LawCard
              accentClass="border-fjord-600"
              abbr="KMS"
              name="Käibemaksuseadus"
              description="KM-kohuslasele arvutatakse 24% õigesti. Kui sa pole kohuslane, ei näita süsteem käibemaksu üldse — nii ei teki kogemata § 3 lg 5 vastutust."
            />
            <LawCard
              accentClass="border-fjord-500"
              abbr="RPS"
              name="Raamatupidamise seadus"
              description="Arveid ei saa kustutada — 7 aasta säilituskohustus on tagatud. Nummerdamine on automaatne. Raamatupidaja on rahul."
            />
          </div>
        </div>
      </section>

      {/* ── 6. Who It's For ─────────────────────────────────────────────── */}
      <section className="bg-fjord-50 border-y border-fjord-100 px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
            Kellele?
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {["Elektritööd", "Torutööd", "Küte ja ventilatsioon", "Gaasitööd", "Viimistlus", "Üldehitus"].map(
              (trade) => (
                <span
                  key={trade}
                  className="inline-block border border-fjord-200 bg-white rounded-full px-4 py-2 text-sm font-medium text-fjord-700"
                >
                  {trade}
                </span>
              )
            )}
          </div>
          <p className="text-muted">
            Oled mõnes muus valdkonnas? QuoteKit sobib igale Eesti teenusepakkujale, kes teeb pakkumisi ja arveid.
          </p>
        </div>
      </section>

      {/* ── 7. Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-fjord-700 px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Proovi järele — see on tasuta
          </h2>
          <p className="mt-4 text-fjord-200 max-w-md mx-auto">
            Pole kuutasu. Pole limiiti. Seadista profiil ja saada esimene pakkumine täna.
          </p>
          <div className="mt-8">
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-fjord-700 hover:bg-fjord-50 transition-colors"
              >
                Alusta
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-fjord-700 hover:bg-fjord-50 transition-colors"
              >
                {t("nav.dashboard")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-fjord-950 px-4 py-6">
        <p className="text-center text-xs text-fjord-400">
          &copy; 2026 QuoteKit
        </p>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProblemCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white border border-fjord-100 rounded-xl p-6">
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-fjord-100 rounded-xl p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function LawCard({
  accentClass,
  abbr,
  name,
  description,
}: {
  accentClass: string;
  abbr: string;
  name: string;
  description: string;
}) {
  return (
    <div className={`border-l-4 ${accentClass} bg-white border border-fjord-100 rounded-r-xl p-6`}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-bold text-foreground">{abbr}</span>
        <span className="text-sm text-muted">— {name}</span>
      </div>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
