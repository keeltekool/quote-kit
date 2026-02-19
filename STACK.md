# QuoteKit — Stack & Architecture Reference

> **Purpose:** Internal architecture reference for QuoteKit. For cross-project overview, see `Claude_Projects/STACK.md`.
>
> Last updated: 2026-02-19

---

## Services

| Service | Purpose | Dashboard |
|---------|---------|-----------|
| **Clerk** | Auth (Google + email) | https://dashboard.clerk.com |
| **Neon** | PostgreSQL database (6 tables) | https://console.neon.tech |
| **Anthropic** | Claude Sonnet — AI service suggestions | https://console.anthropic.com |
| **Cloudflare R2** | Company logo storage (bucket: `quotekit`) | https://dash.cloudflare.com |
| **Äriregister API** | Estonian business registry lookup | https://ariregister.rik.ee |
| **HankeRadar API** | Estonian procurement feed | https://hanke-radar.onrender.com |
| **Vercel** | Hosting + Serverless | https://vercel.com/egertv1s-projects |

---

## URLs

| Environment | URL |
|-------------|-----|
| **Production** | https://quote-kit.vercel.app |
| **Local dev** | http://localhost:3003 |
| **GitHub** | https://github.com/keeltekool/quote-kit |
| **R2 Public** | https://pub-734fb34c531a46cb81b648b40cb4d04f.r2.dev |

---

## Env Vars (14 total)

| Variable | Source | Sensitive |
|----------|--------|-----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard | No |
| `CLERK_SECRET_KEY` | Clerk dashboard | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | No |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` | No |
| `DATABASE_URL` | Neon console (pooler) | Yes |
| `ANTHROPIC_API_KEY` | Anthropic console | Yes |
| `R2_ACCOUNT_ID` | Cloudflare dashboard | No |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API tokens | Yes |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API tokens | Yes |
| `R2_BUCKET_NAME` | `quotekit` | No |
| `R2_ENDPOINT` | Cloudflare R2 | No |
| `R2_PUBLIC_URL` | Cloudflare R2 public bucket | No |

Stored in: `.env.local` (local), Vercel (production — 14 vars confirmed)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** React 19, TypeScript
- **Styling:** Tailwind CSS 4 (Fjord Blue-Gray design system)
- **Fonts:** Inter (body), JetBrains Mono (money, IDs, dates)
- **ORM:** Drizzle ORM
- **Database:** Neon PostgreSQL (EU region, pooler connection)
- **Auth:** Clerk (Google OAuth + email)
- **AI:** Anthropic Claude Sonnet (service suggestions)
- **Storage:** Cloudflare R2 via AWS SDK (presigned uploads)
- **PDF:** Puppeteer-Core (Vercel serverless, 60s/1024MB)
- **i18n:** next-intl (ET/EN, locale-prefixed routes)
- **Hosting:** Vercel (region: iad1)

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/(app)/          # Authenticated app pages
│   │   ├── dashboard/page.tsx
│   │   ├── quotes/              # list, [id], [id]/edit, new
│   │   ├── invoices/            # list, [id]
│   │   ├── clients/page.tsx
│   │   ├── services/page.tsx
│   │   ├── hanked/page.tsx      # Public tenders (HankeRadar proxy)
│   │   ├── settings/page.tsx
│   │   └── layout.tsx           # App shell (sidebar + main)
│   ├── [locale]/(auth)/         # Auth pages (sign-in, sign-up)
│   ├── [locale]/page.tsx        # Landing page
│   ├── api/                     # API routes (18 endpoints)
│   ├── globals.css              # Fjord color tokens
│   └── layout.tsx               # Root layout (fonts, Clerk, i18n)
├── components/
│   ├── app-sidebar.tsx          # Desktop sidebar (color-coded nav)
│   ├── mobile-nav.tsx           # Mobile hamburger nav
│   └── quotekit-logo.tsx        # Brand logo component
├── i18n/
│   ├── routing.ts               # next-intl routing config
│   └── request.ts
├── lib/
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema (6 tables)
│   │   └── index.ts             # DB connection
│   ├── r2.ts                    # Cloudflare R2 client
│   └── utils.ts
├── messages/
│   ├── et.json                  # Estonian translations
│   └── en.json                  # English translations
└── middleware.ts                 # Clerk + next-intl middleware
```

---

## DB Schema (6 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `business_profiles` | User's company profile | companyName, registryCode, tradeType, IBAN, VAT, defaults |
| `catalog_services` | Reusable service catalog | nameEt, nameEn, category, unitPrice, unit, isMaterial |
| `clients` | Client registry (B2B/B2C) | name, clientType, registryCode, kmkrNumber, address |
| `quotes` | Quote documents | quoteNumber, lineItems (JSONB), clientSnapshot, businessSnapshot, legal terms |
| `invoices` | Invoice documents | invoiceNumber, quoteId (nullable), lineItems (JSONB), status, dueDate |
| `invoice_counters` | Sequential numbering | currentInvoiceNumber, currentQuoteNumber |
| `document_files` | PDF file references | documentType, documentId, fileUrl |

All tables use `userId` (Clerk user ID) for multi-tenancy. Quotes and invoices store client/business data as JSONB snapshots (immutable at creation time). Invoices have no delete — 7-year retention per Estonian RPS § 12.

---

## API Endpoints (20 routes)

| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/api/profile` | Business profile CRUD |
| POST | `/api/profile/logo` | Upload company logo to R2 |
| GET/POST | `/api/services` | Service catalog list/create |
| PUT/DELETE | `/api/services/[id]` | Service update/delete |
| POST | `/api/services/suggest` | AI service suggestions (Claude Sonnet) |
| GET/POST | `/api/clients` | Client list/create |
| PUT/DELETE | `/api/clients/[id]` | Client update/delete |
| GET | `/api/ariregister/search` | Estonian business registry lookup |
| GET/POST | `/api/quotes` | Quote list/create |
| GET/PUT/DELETE | `/api/quotes/[id]` | Quote detail/update/delete |
| POST | `/api/quotes/[id]/status` | Update quote status |
| POST | `/api/quotes/[id]/duplicate` | Duplicate quote |
| POST | `/api/quotes/generate` | AI-generate quote line items |
| GET/POST | `/api/invoices` | Invoice list/create (from quote or standalone) |
| GET/PUT | `/api/invoices/[id]` | Invoice detail/update |
| POST | `/api/invoices/[id]/status` | Update invoice status |
| POST | `/api/export/pdf` | Generate PDF (Puppeteer, 60s timeout) |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/hanked` | Proxy to HankeRadar (trade-filtered procurements) |
| POST | `/api/hanked/create-quote` | Find/create client from procurement data |

All authenticated routes use Clerk's `auth()` middleware. API routes skip intl middleware.

---

## Auth Flow

1. Clerk handles sign-in/sign-up (Google OAuth + email)
2. `middleware.ts`: Clerk middleware wraps next-intl middleware
3. Public routes: `/`, `/:locale`, sign-in/sign-up pages
4. Protected routes: everything under `/(app)/` — `auth.protect()` redirects to sign-in
5. API routes: skip intl middleware, `auth.protect()` returns 401
6. `userId` from `auth()` used in all API handlers for multi-tenancy

---

## Brand: Fjord Blue-Gray

- **Primary:** fjord-700 `#3A5060`
- **Background:** fjord-50 `#F4F7F9`
- **Surface:** white (cards)
- **Text:** fjord-950 `#1C2B33`
- **Muted:** fjord-600 `#546A7B`
- **Border:** fjord-100 `#D4E0E6`
- **Sidebar:** Color-coded active states per section (cyan quotes, emerald clients, purple invoices, amber services)
- **Money/IDs/dates:** JetBrains Mono font

---

## Gotchas

| Issue | Fix |
|-------|-----|
| Turbopack + Google Fonts bug | Always use `--webpack` flag: `npx next dev -p 3003 --webpack` |
| Vercel env vars via printf | Use `echo -n "value" \| npx vercel env add NAME production` — one at a time, never chain |
| PDF export timeout | `vercel.json` sets 60s/1024MB for `/api/export/pdf` route |
| Invoice deletion | NOT ALLOWED — 7-year retention per Estonian RPS § 12. Use cancel status instead |
| JSONB snapshots | Quotes/invoices freeze client+business data at creation. Editing client later doesn't change existing documents |
| Clerk dev keys on Vercel | `pk_test_`/`sk_test_` keys work on any domain — no domain restriction in dev mode |

---

## Deployment

```bash
# Local dev
npx next dev -p 3003 --webpack

# Deploy to production
npx vercel --prod

# Add env var to Vercel
echo -n "value" | npx vercel env add VAR_NAME production

# DB migrations
npx drizzle-kit push

# Type check
npx tsc --noEmit
```

Vercel config: `vercel.json` — region `iad1`, PDF function 60s/1024MB.
