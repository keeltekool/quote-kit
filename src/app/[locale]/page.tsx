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
    <div className="min-h-screen bg-fjord-50 font-sans text-fjord-950">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-fjord-100 bg-fjord-50/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="no-underline">
            <QuoteKitLogo variant="full" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#funktsioonid" className="rounded-lg px-3 py-2 text-sm font-medium text-fjord-600 transition-colors hover:text-fjord-950">Funktsioonid</a>
            <a href="#seadused" className="rounded-lg px-3 py-2 text-sm font-medium text-fjord-600 transition-colors hover:text-fjord-950">Seadused</a>
            <a href="#kellele" className="rounded-lg px-3 py-2 text-sm font-medium text-fjord-600 transition-colors hover:text-fjord-950">Kellele</a>
          </nav>
          <div className="flex items-center gap-2">
            <SignedOut>
              <Link href="/sign-in" className="rounded-lg px-3.5 py-2 text-sm font-medium text-fjord-700 no-underline transition-colors hover:text-fjord-950">
                Logi sisse
              </Link>
              <Link href="/sign-in" className="rounded-lg bg-fjord-700 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-fjord-800">
                Proovi tasuta
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="rounded-lg bg-fjord-700 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-fjord-800">
                {t("nav.dashboard")}
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="border-b border-fjord-100 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          {/* Copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fjord-200 bg-white px-3 py-1.5 text-xs font-semibold text-fjord-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tehtud Eesti käsitöölistele
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-fjord-950 sm:text-5xl">
              Pakkumised ja arved,<br />
              <span className="text-fjord-700">mis on juba seaduslikud</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-fjord-600">
              Tee hinnapakkumine valmis <span className="font-mono font-semibold text-fjord-800">5&nbsp;minutiga</span>. Käibemaks, garantii ja VÕS klauslid arvutatakse ja lisatakse automaatselt.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SignedOut>
                <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-lg bg-fjord-700 px-7 py-3.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-fjord-800">
                  Proovi tasuta
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <a href="#funktsioonid" className="inline-flex items-center gap-2 rounded-lg border border-fjord-200 bg-white px-7 py-3.5 text-sm font-semibold text-fjord-700 no-underline transition-colors hover:border-fjord-300 hover:bg-fjord-50">
                  Vaata, kuidas töötab
                </a>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-fjord-700 px-7 py-3.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-fjord-800">
                  {t("nav.dashboard")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </SignedIn>
            </div>
            <p className="mt-4 text-xs text-fjord-500">Tasuta &middot; Ei küsi kaarti &middot; Eesti keeles</p>
          </div>

          {/* Product artifact — a real quote */}
          <div className="relative lg:pl-6">
            <QuoteMock />
          </div>
        </div>
      </section>

      {/* ── Stat strip ──────────────────────────────────────────────────── */}
      <section className="border-b border-fjord-100 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat number="5 min" label="Pakkumine valmis" />
          <Stat number="24%" label="Käibemaks automaatselt" />
          <Stat number="3" label="Seadust sisse ehitatud" />
          <Stat number="0 €" label="Kuutasu" />
        </div>
      </section>

      {/* ── 2. Problem Statement ────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionLabel>Probleem</SectionLabel>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fjord-950">Tuttav olukord?</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <ProblemCard
              num="01"
              title="Pakkumine Excelis, arve Wordis"
              description="Kopeeri-kleebi kliendi andmed, arvuta käibemaks kalkulaatoriga, kujunda PDF käsitsi. Iga pakkumine võtab pool tundi."
            />
            <ProblemCard
              num="02"
              title="Mis see VÕS § 639 oli?"
              description="Tead, et pakkumisel peab mingi klausel olema, aga mis täpselt? Guugeldad iga kord uuesti."
            />
            <ProblemCard
              num="03"
              title="Arve number... 17? Või 18?"
              description="Nummerdamine läheb sassi, raamatupidaja helistab, nüüd on jama."
            />
          </div>
        </div>
      </section>

      {/* ── 3. Features Grid ────────────────────────────────────────────── */}
      <section id="funktsioonid" className="border-y border-fjord-100 bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionLabel>Funktsioonid</SectionLabel>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fjord-950">QuoteKit teeb selle ära</h2>
            <p className="mt-4 text-lg leading-relaxed text-fjord-600">
              Üks koht pakkumiste ja arvete jaoks. Eesti seadused on juba sisse ehitatud — sina keskendud tööle.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard chipClass="bg-[#FBF8F1] text-[#92702D]" icon={<SparklesIcon className="h-5 w-5" />}
              title="Teenuste kataloog"
              description="Sisesta oma eriala ja AI pakub välja teenused koos hindadega. Salvesta kataloog — järgmine pakkumine on ühe klikiga valmis." />
            <FeatureCard chipClass="bg-cyan-50 text-cyan-600" icon={<ClockIcon className="h-5 w-5" />}
              title="Pakkumine 5 minutiga"
              description="Vali klient, lisa read kataloogist. Käibemaks, garantii, VÕS klauslid — kõik arvutatakse ja lisatakse automaatselt." />
            <FeatureCard chipClass="bg-[#F5F3F7] text-[#6B5B73]" icon={<FileCheckIcon className="h-5 w-5" />}
              title="Pakkumisest arveks"
              description="Klient kinnitas? Vajuta nuppu ja arve on valmis. Kõik andmed kanduvad üle, number pannakse automaatselt." />
            <FeatureCard chipClass="bg-fjord-50 text-fjord-700" icon={<ShareIcon className="h-5 w-5" />}
              title="Jaga PDF-iga"
              description="Saada professionaalne PDF otse WhatsAppi, e-postiga või jagatava lingiga. Sinu logo ja andmed on peal." />
            <FeatureCard chipClass="bg-emerald-50 text-emerald-600" icon={<SearchIcon className="h-5 w-5" />}
              title="Äriregistri otsing"
              description="Sisesta registrikood — ettevõtte nimi, aadress ja KMKR ilmuvad automaatselt. Pole vaja midagi käsitsi otsida." />
            <FeatureCard chipClass="bg-amber-50 text-amber-600" icon={<CalculatorIcon className="h-5 w-5" />}
              title="Käibemaksu kontroll"
              description="KM-kohuslasele arvutab 24% automaatselt. Pole veel kohuslane? Süsteem jälgib 40 000 € piiri ja hoiatab ette." />
          </div>
        </div>
      </section>

      {/* ── 4. Legal Compliance ─────────────────────────────────────────── */}
      <section id="seadused" className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 max-w-2xl">
            <SectionLabel>Seaduslikkus</SectionLabel>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fjord-950">Seadused, millest sa ei pea aru saama</h2>
            <p className="mt-4 text-lg leading-relaxed text-fjord-600">
              QuoteKit lisab õiged klauslid automaatselt. Sinu pakkumised ja arved vastavad Eesti õigusele ilma, et peaksid juristilt nõu küsima.
            </p>
          </div>
          <div className="space-y-4">
            <LawCard abbr="VÕS" name="Võlaõigusseadus"
              description="Mittesiduv pakkumus (§ 16), lisatööde kokkulepe (§ 639), 2-aastane garantii (§ 642), tarbija taganemisõigus (§ 46–49) — igale pakkumisele automaatselt." />
            <LawCard abbr="KMS" name="Käibemaksuseadus"
              description="KM-kohuslasele arvutatakse 24% õigesti. Kui sa pole kohuslane, ei näita süsteem käibemaksu üldse — nii ei teki kogemata § 3 lg 5 vastutust." />
            <LawCard abbr="RPS" name="Raamatupidamise seadus"
              description="Arveid ei saa kustutada — 7 aasta säilituskohustus on tagatud. Nummerdamine on automaatne. Raamatupidaja on rahul." />
          </div>
        </div>
      </section>

      {/* ── 5. Who It's For ─────────────────────────────────────────────── */}
      <section id="kellele" className="border-y border-fjord-100 bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel center>Kellele</SectionLabel>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fjord-950">Igale Eesti teenusepakkujale</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {["Elektritööd", "Torutööd", "Küte ja ventilatsioon", "Gaasitööd", "Viimistlus", "Üldehitus"].map((trade) => (
              <span key={trade} className="inline-block rounded-full border border-fjord-200 bg-fjord-50 px-4 py-2 text-sm font-medium text-fjord-700">
                {trade}
              </span>
            ))}
          </div>
          <p className="mt-6 text-fjord-600">
            Oled mõnes muus valdkonnas? QuoteKit sobib igale, kes teeb pakkumisi ja arveid.
          </p>
        </div>
      </section>

      {/* ── 6. Final CTA ────────────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-fjord-950 px-6 py-16 text-center sm:px-12">
          <ShieldCheckIcon className="mx-auto mb-5 h-9 w-9 text-fjord-300" />
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Proovi järele — see on tasuta
          </h2>
          <p className="mx-auto mt-4 max-w-md text-fjord-300">
            Pole kuutasu. Pole limiiti. Seadista profiil ja saada esimene pakkumine täna.
          </p>
          <div className="mt-8">
            <SignedOut>
              <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-fjord-950 no-underline transition-colors hover:bg-fjord-100">
                Alusta tasuta
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-fjord-950 no-underline transition-colors hover:bg-fjord-100">
                {t("nav.dashboard")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-fjord-100 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <QuoteKitLogo variant="compact" />
          <p className="text-xs text-fjord-500">&copy; 2026 QuoteKit &middot; Tehtud Eestis</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-fjord-600 ${center ? "justify-center" : ""}`}>
      <span className="h-px w-6 bg-fjord-400" />
      {children}
    </p>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-[28px] font-bold leading-none text-fjord-950">{number}</p>
      <p className="mt-2 text-[13px] font-medium text-fjord-600">{label}</p>
    </div>
  );
}

function ProblemCard({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-fjord-100 bg-white p-6">
      <span className="font-mono text-[13px] font-semibold text-fjord-400">{num}</span>
      <h3 className="mt-3 font-semibold text-fjord-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fjord-600">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, chipClass, title, description }: { icon: React.ReactNode; chipClass: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-fjord-100 bg-white p-6 transition-colors hover:border-fjord-200">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${chipClass}`}>{icon}</div>
      <h3 className="font-semibold text-fjord-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fjord-600">{description}</p>
    </div>
  );
}

function LawCard({ abbr, name, description }: { abbr: string; name: string; description: string }) {
  return (
    <div className="rounded-xl border border-fjord-100 bg-white p-6">
      <div className="mb-2 flex items-baseline gap-2.5">
        <span className="font-mono text-base font-bold text-fjord-700">{abbr}</span>
        <span className="text-sm text-fjord-600">— {name}</span>
      </div>
      <p className="text-sm leading-relaxed text-fjord-600">{description}</p>
    </div>
  );
}

// ─── Hero product artifact: a realistic quote ────────────────────────────────

function QuoteMock() {
  return (
    <div className="mx-auto w-full max-w-[440px] rounded-2xl border border-fjord-100 bg-white shadow-[0_20px_50px_-24px_rgba(28,43,51,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fjord-100 px-5 py-4">
        <QuoteKitLogo variant="compact" />
        <span className="rounded-full border border-fjord-200 bg-fjord-50 px-2.5 py-0.5 text-xs font-medium text-fjord-700">
          Saadetud
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fjord-600">Hinnapakkumine</p>
          <p className="font-mono text-lg font-bold text-fjord-950">HP-024</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fjord-600">Klient</p>
          <p className="text-sm font-medium text-fjord-950">Tamme Kodu OÜ</p>
          <p className="font-mono text-[12px] text-fjord-500">17.02.2026</p>
        </div>
      </div>

      {/* Line items */}
      <div className="px-5 pt-5">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-fjord-500">Tööd</p>
        <MockRow label="Elektritöö" qty="8 h × €35,00" total="€280,00" />
        <MockRow label="Paigaldus ja seadistus" qty="1 tk" total="€120,00" />
        <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-wider text-fjord-500">Materjalid</p>
        <MockRow label="Kaablid ja tarvikud" qty="40 m × €2,10" total="€84,00" />
      </div>

      {/* Totals */}
      <div className="mx-5 mt-4 border-t border-fjord-100 pt-3">
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[13px] text-fjord-600">Vahesumma</span>
          <span className="font-mono text-[13px] text-fjord-700">€484,00</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[13px] text-fjord-600">Käibemaks 24%</span>
          <span className="font-mono text-[13px] text-fjord-700">€116,16</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t-2 border-fjord-100 pt-2">
          <span className="text-sm font-semibold text-fjord-950">Kokku</span>
          <span className="font-mono text-xl font-bold text-fjord-950">€600,16</span>
        </div>
      </div>

      {/* Auto clause */}
      <div className="mx-5 mb-5 mt-4 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3.5 py-2.5">
        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <p className="text-xs text-fjord-700">
          <span className="font-mono font-semibold">VÕS § 642</span> — 2-a garantii lisatud automaatselt
        </p>
      </div>
    </div>
  );
}

function MockRow({ label, qty, total }: { label: string; qty: string; total: string }) {
  return (
    <div className="flex items-center justify-between border-b border-fjord-50 py-2">
      <div>
        <p className="text-[13px] font-medium text-fjord-950">{label}</p>
        <p className="font-mono text-[11px] text-fjord-500">{qty}</p>
      </div>
      <span className="font-mono text-[13px] font-semibold text-fjord-950">{total}</span>
    </div>
  );
}
