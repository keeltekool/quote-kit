# QuoteKit — Product Requirements Document (MVP)

> **Version:** 1.0
> **Date:** 2026-02-16
> **Status:** APPROVED
> **Regulatory reference:** `EE-BUSINESS-RULES.md`, `REGULATION-FEATURES.md`

---

## 1. Executive Summary

**QuoteKit** is an AI-powered quoting and invoicing PWA for Estonian tradespeople (plumbers, electricians, painters, HVAC, general renovation). Mobile-first, bilingual (ET/EN).

**Core loop:** Tradesperson sets up business profile + service catalog → describes a job → AI generates a professional, legally compliant quote from the catalog → sends via WhatsApp/email → tracks status → converts to invoice when work is done.

**Market:** Estonian tradespeople. Zero local competition for an AI-assisted, regulation-compliant quoting tool. Bilingual ET/EN.

**Revenue:** SaaS subscription (~€29-49/month). No billing infrastructure in MVP — free launch, add Stripe later.

**Sales channel:** Lead Radar finds prospects → QuoteKit is the product sold to them. Also standalone SaaS.

**Differentiator:** Estonian legal compliance baked into every template. Not an afterthought — it's the product's core value. An overly formal quote impresses. A legally incorrect invoice kills the business relationship.

---

## 2. Problem Statement

Estonian tradespeople currently create quotes and invoices by:
- Copy-pasting old Word/Excel files and manually editing
- Using generic EU invoicing tools that don't know Estonian law
- Scribbling estimates on paper or WhatsApp messages
- Paying an accountant to fix non-compliant invoices after the fact

**Pain points:**
1. Slow — creating a proper quote takes 15-30 minutes (finding old template, editing, formatting, calculating VAT)
2. Error-prone — wrong VAT treatment, missing mandatory fields, no validity period, no disclaimers
3. Unprofessional — inconsistent formatting, no branding, looks amateur
4. No tracking — "Did they even open it?" No idea.
5. Disconnected — quote lives in one place, invoice in another, nothing links together
6. Legally risky — missing VÕS § 639 additional work clauses means you can't charge for overruns

**QuoteKit solves all six** by making the legally correct thing the default, AI handles the tedious parts, and everything flows from quote → invoice in one system.

---

## 3. Target User

**Primary persona: Margus, 38, plumber (OÜ owner)**
- Runs a 1-3 person plumbing company in Tallinn/Tartu
- Does 3-8 jobs per week, each needs a quote
- Technically competent with phone, uses WhatsApp for client communication
- Hates paperwork, currently uses Excel or Word templates his accountant gave him
- VAT-registered (annual turnover >€40k)
- Wants to look professional to win more work

**Secondary persona: Kati, 29, painter (FIE)**
- Sole proprietor (FIE), NOT VAT-registered
- Does interior painting and finishing work
- Turnover ~€25k/year, approaching VAT threshold but unaware
- Currently sends prices via WhatsApp messages — no formal quotes at all
- Needs the €40k threshold tracker more than she knows

**Common traits:**
- Mobile-first (phone is primary device on job sites)
- Estonian-speaking, some English capability
- Value speed over features — 60 seconds to create a quote or they won't use it
- Trust professional-looking output — it helps win jobs

---

## 4. MVP Scope

### IN (MVP — Phase 1)

| Module | What's Included |
|--------|----------------|
| **Onboarding** | Business profile wizard (company info, VAT status, trade type, bank details, logo) |
| **Service Catalog** | Pre-saved services with default prices, units, categories — THE foundation for AI |
| **Client Management** | Add/edit clients, B2B/B2C toggle, Äriregister auto-fill for companies |
| **Quote Creation** | Text description + service catalog → AI generates line items → review/edit → PDF |
| **Quote Dashboard** | All quotes with status lifecycle (Draft → Sent → Viewed → Accepted → Declined → Expired) |
| **Invoice Generation** | Two paths: convert accepted quote → invoice (pre-filled) OR create standalone invoice from scratch. Sequential numbering, VAT/non-VAT dual mode |
| **PDF Engine** | Professional A4 documents — quotes and invoices. Estonian document layout standard. |
| **Sharing** | Send quote/invoice PDF via email share link, WhatsApp share, direct download |
| **Legal Compliance** | All baked-in rules from REGULATION-FEATURES.md: validity periods, disclaimers, VAT handling, registry codes, B2C withdrawal notices, warranty sections |
| **i18n** | Full bilingual ET/EN — UI and generated documents |
| **PWA** | Installable, add-to-homescreen, basic offline indicator |

### OUT (Post-MVP)

| Feature | Phase |
|---------|-------|
| Photo → AI analysis (Claude Vision) | Phase 2 |
| Voice memo → transcription → AI line items | Phase 2 |
| Advance invoices + reconciliation | Phase 2 |
| Additional work approval flow (client-facing link) | Phase 2 |
| Late payment interest auto-calculation + reminders | Phase 2 |
| €40k VAT threshold tracker with warnings | Phase 2 |
| Acceptance act generation | Phase 2 |
| Credit note support | Phase 3 |
| UBL 2.1 XML e-invoice generation | Phase 3 |
| Finbite integration for e-arve delivery | Phase 3 |
| Client portal (view/accept quotes online) | Phase 3 |
| Push notifications | Phase 3 |
| Stripe billing / subscription management | Phase 2 |
| Annual accountant export | Phase 3 |

### MVP Expansion Hooks (built now, activated later)

These architectural decisions are made in MVP to avoid rewrites:

1. **Document type enum** — schema supports all 7 document types from day 1, even though MVP only generates quotes + invoices
2. **Quote status field** — full lifecycle enum (including VIEWED which requires a tracking link in Phase 2)
3. **Client type field** — B2B/B2C distinction stored, even though B2C withdrawal notices are simplified in MVP
4. **Service catalog structure** — supports categories, units, and time estimates, ready for voice/photo AI input later
5. **Invoice numbering counter** — per-user sequential counter table, ready for credit notes and advance invoices
6. **File attachments schema** — R2 integration for photos, even though MVP doesn't do photo analysis

---

## 5. User Flows

### Flow 1: Onboarding (one-time, ~3 minutes)

```
Sign up (Clerk)
  → Business Profile Wizard:
    Step 1: Company basics (name, registry code, address, phone, email)
    Step 2: VAT status toggle (YES → enter KMKR number, validated)
    Step 3: Trade type (dropdown) → if regulated → MTR prompt
    Step 4: Bank details (IBAN, bank name)
    Step 5: Logo upload (optional, R2)
    Step 6: Default settings (payment terms: 14 days, warranty: 2yr B2C / custom B2B, quote validity: 14 days)
  → Service Catalog Setup:
    "Add your most common services" (can skip and add later)
    → For each service: name (ET), name (EN), category, default unit price, unit (h/m²/tk/km), estimated time
    → AI suggestion: based on trade type, suggest common services (e.g., plumber → "Torude vahetus", "Segisti paigaldus", etc.)
  → Dashboard (ready to create first quote)
```

### Flow 2: Service Catalog Management (ongoing)

```
Settings → Service Catalog
  → View all services grouped by category
  → Add new service: name, price, unit, category, optional description
  → Edit existing service: update price, rename, change category
  → Duplicate service (for variations)
  → Archive service (soft delete — never hard delete, historical quotes reference these)
  → Import: AI can suggest services based on trade type
```

### Flow 3: Create Quote (~60-90 seconds)

```
Dashboard → "Uus pakkumine" / "New Quote"
  → Step 1: Select or create client
    - Type company name → Äriregister autocomplete (B2B)
    - Or enter private person details (B2C)
  → Step 2: Describe the job
    - Free text area: "What needs to be done?"
    - Optional: select services from catalog (checkboxes, quick-add)
    - Optional: adjust quantities, add notes
  → Step 3: AI generates quote
    - AI reads: job description + selected services + service catalog + business profile
    - AI outputs: structured line items (service name, qty, unit, unit price, total)
    - AI separates: labor vs materials (best practice)
    - All legal clauses auto-included based on business profile (VAT status, B2B/B2C, trade type)
  → Step 4: Review & edit
    - Edit any line item (price, quantity, description)
    - Add/remove lines manually
    - Adjust validity period, payment terms
    - Toggle optional clauses (material price fluctuation, specific warranty terms)
    - Preview PDF in real-time
  → Step 5: Save & send
    - Save as draft OR
    - Generate PDF → share via WhatsApp / email / download
    - Status changes to SENT
```

### Flow 4: Quote Dashboard & Tracking

```
Dashboard → All quotes listed
  - Filter by status: All / Draft / Sent / Accepted / Declined / Expired
  - Search by client name or quote number
  - Sort by date, amount, status
  - Each quote shows: number, client, amount, date, status badge, quick actions

  Quick actions per quote:
  - View PDF
  - Duplicate (create similar quote for different client)
  - Edit (if still Draft)
  - Mark as Accepted / Declined (manual status update — MVP)
  - Convert to Invoice (if Accepted)
  - Delete (if Draft only)

  Auto-expiry: quotes past validity date automatically marked EXPIRED
```

### Flow 5a: Quote → Invoice Conversion

```
Accepted quote → "Koosta arve" / "Create Invoice"
  → Invoice pre-filled from quote data:
    - Client info (carried over)
    - Line items (carried over, editable)
    - Sequential invoice number (auto-assigned from user's counter)
    - Invoice date (today)
    - Service date (user enters or defaults to today)
    - Payment terms (from business profile defaults)
    - Bank details (from business profile)
    - VAT calculated (if VAT-registered) or omitted entirely (if not)
  → Review & adjust
    - Can modify line items if scope changed
    - Payment terms editable
    - Notes field
  → Generate PDF → share
  → 7-day issuance reminder shown if work was marked completed earlier
```

### Flow 5b: Standalone Invoice (no quote)

```
Dashboard → "Uus arve" / "New Invoice"
  → Same invoice form, but starts empty:
    - Select or create client
    - Add line items manually (from catalog or freeform)
    - All other fields same as quote-based invoice
  → No linked quote_id in DB (NULL)
  → Same PDF output, same legal compliance
  → Use case: quick callout fees, small repairs, repeat jobs that don't need formal quotes
```

### Flow 6: Settings & Profile Management

```
Settings page:
  → Business Profile (edit company info, VAT status, logo, bank details)
  → Service Catalog (add/edit/archive services)
  → Document Defaults (validity period, payment terms, warranty text, accent color)
  → Invoice Counter (view current number, format prefix)
  → Language preference (ET/EN for UI)
  → Document language (ET/EN — global setting for all generated documents)
```

---

## 6. Feature Specifications

### 6.1 Business Profile Module

**Purpose:** Store all company information needed on every document.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Company name (ärinimi) | text | YES | min 2 chars | |
| Registry code (registrikood) | text | YES | 8 digits | Äriseadustik § 15(2) — on ALL documents |
| Address | text | YES | | |
| Phone | text | YES | | |
| Email | text | YES | valid email | |
| VAT registered | boolean | YES | | THE master toggle |
| KMKR number | text | IF VAT=true | EE + 9 digits, VIES validation | Hidden entirely if VAT=false |
| Trade type | enum | YES | dropdown | Electrical, Plumbing, HVAC, Gas, Painting, General renovation, Other |
| MTR registered | boolean | IF regulated trade | | Only shown for electrical/plumbing/HVAC/gas |
| MTR reference | text | IF MTR=true | | |
| IBAN | text | YES | EE + valid format | |
| Bank name | text | YES | | |
| Logo | file (R2) | NO | image, max 2MB | |
| Default payment terms (days) | integer | YES | default: 14 | |
| Default quote validity (days) | integer | YES | default: 14 | |
| Default warranty text (B2C) | text | YES | default: "24 kuud" | |
| Default warranty text (B2B) | text | YES | default: "Lepitakse kokku eraldi" | |
| Invoice number prefix | text | NO | default: year (e.g. "2026") | |
| Quote number prefix | text | NO | default: "HP" | |

**VAT toggle behavior:**
- ON → KMKR field appears, all documents show VAT lines, advance payments trigger VAT
- OFF → KMKR field hidden, NO VAT references on any document, prices are final amounts

### 6.2 Service Catalog Module

**Purpose:** The tradesperson's pricelist. Foundation for AI quote generation. Without this, AI output is generic slop.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name (ET) | text | YES | e.g., "Torude vahetus" |
| Name (EN) | text | NO | e.g., "Pipe replacement" |
| Category | text | YES | e.g., "Torustik", "Elekter", "Viimistlus" |
| Unit price (excl. VAT) | decimal | YES | e.g., 80.00 |
| Unit | enum | YES | h (hour), m² (square meter), tk (piece/unit), jm (running meter), km (set), päev (day) |
| Description | text | NO | Optional detail for AI context |
| Is material | boolean | NO | default: false. Separates labor from materials |
| Estimated time (minutes) | integer | NO | Helps AI estimate job duration |
| Active | boolean | YES | default: true. Archived services = false |

**Categories are user-defined** — no hardcoded list. During onboarding, AI suggests category names based on trade type.

**AI service suggestions:** On first setup (and available anytime), AI generates a starter catalog based on trade type:
- Plumber → suggests 10-15 common plumbing services with typical Estonian market prices
- Electrician → electrical services + competence-class-appropriate scope
- Painter → painting/finishing services per m²
- User reviews, adjusts prices, saves. This is NOT auto-saved — user must confirm each.

### 6.3 Client Management Module

**Purpose:** Store client details for reuse across quotes/invoices.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Client type | enum | YES | "ettevõte" (B2B) or "eraisik" (B2C) |
| Name | text | YES | Company name or person name |
| Registry code | text | IF B2B | Auto-filled from Äriregister |
| KMKR number | text | IF B2B + VAT registered | Auto-filled from Äriregister |
| Address | text | YES | |
| Email | text | NO | For sending documents |
| Phone | text | NO | |
| Contact person | text | IF B2B | |
| E-invoice recipient | boolean | auto-checked | Äriregister API check on B2B creation |
| Notes | text | NO | Internal notes |

**Äriregister auto-fill flow (B2B):**
1. User types company name in search field
2. Autocomplete calls `ariregister.rik.ee/est/api/autocomplete?q={query}`
3. User selects company → auto-fills: name, registry code, address
4. KMKR: if RIK agreement available, auto-fill; otherwise user enters manually
5. E-invoice check runs automatically, result stored

**B2B vs B2C impact on documents:**
- B2B: registry code on document, no withdrawal notice
- B2C: no registry code, consumer withdrawal notice on quotes (VÕS §§ 46-49), 2-year warranty default

### 6.4 Quote Creation Module (AI-Assisted)

**Purpose:** The core product experience. Job description + service catalog → professional quote in 60 seconds.

**AI prompt architecture:**

The AI receives a structured context:
```
SYSTEM: You are a quote generation assistant for Estonian tradespeople.
Generate structured line items based on the job description and the
tradesperson's service catalog. Output JSON with line items.

CONTEXT:
- Business: {company name}, {trade type}
- VAT registered: {yes/no}
- Service catalog: {full catalog as JSON}
- Client type: {B2B/B2C}

USER INPUT:
- Job description: "{free text from user}"
- Pre-selected services: [{service IDs and quantities if any}]

OUTPUT FORMAT:
{
  "lineItems": [
    {
      "description": "Service name",
      "quantity": 2,
      "unit": "h",
      "unitPrice": 80.00,
      "isMaterial": false,
      "catalogServiceId": "uuid-if-matched" | null
    }
  ],
  "notes": "Any observations about the job",
  "estimatedDuration": "4-6 hours"
}
```

**AI behavior rules:**
- ALWAYS prefer matching to catalog services (consistent pricing)
- If job requires services NOT in catalog → generate new line items but flag them
- Separate labor and materials into distinct line items
- Never invent prices — use catalog prices or flag for user review
- If description is too vague → return fewer items + a note asking for clarification

**Quote document auto-includes (non-negotiable):**
- Validity period (default from profile)
- Non-binding disclaimer (VÕS § 16(2))
- Additional work clause (VÕS § 639)
- Registry code (Äriseadustik § 15(2))
- VAT lines IF registered / completely absent if NOT
- Warranty section (2yr B2C default / custom B2B)
- Consumer withdrawal notice (if B2C)
- Payment terms + bank details

### 6.5 Invoice Module

**Purpose:** Convert accepted quotes to legally compliant invoices.

**VAT-registered invoice (KMS § 37(7)) — 10 mandatory fields:**
1. Sequential number + date
2. Seller: name, address, KMKR
3. Buyer: name, address
4. Buyer KMKR (if B2B + VAT registered)
5. Service description
6. Quantity
7. Service date (if ≠ invoice date)
8. Unit price excl. VAT + discount
9. Taxable amount per rate + rate shown
10. VAT amount in EUR

Plus: registry code (always), payment terms, bank details.

**Non-VAT invoice (RPS § 7) — separate template:**
1. Document name + sequential number
2. Date
3. Seller: name, registry code, address
4. Buyer: name, address, registry code (if B2B)
5. Service description
6. Quantity, unit price, total
7. Payment terms + bank details

**NO VAT REFERENCES AT ALL.** Not "KM 0%", not "käibemaks: €0.00" — completely absent.

**Invoice numbering:**
- Auto-sequential per user (counter stored in DB)
- Format: `{prefix}-{number}` (e.g., "2026-001")
- Prefix configurable in settings (default: current year)
- Gaps logged but acceptable (cancelled invoices)
- Counter never decrements

### 6.6 PDF Document Engine

**Purpose:** Generate professional A4 PDFs for quotes and invoices.

**Technology:** Puppeteer-Core (proven pattern from ApplyKit)
- Client: React component → DOM serialization + CSS extraction
- Server: `/api/export/pdf` → Puppeteer renders to PDF
- Vercel: @sparticuz/chromium for headless Chrome

**One clean template.** Accent color configurable in settings. More templates can be added later if there's demand.

**Document layout structure:**
```
1. Company header (logo, name, registry code, KMKR if VAT, address, contact)
2. Document title + number + date + validity (quotes)
3. Client info block (name, registry code if B2B, KMKR if B2B+VAT, address)
4. Line items table (Nr, Description, Qty, Unit, Unit Price, Total)
5. Totals block (subtotal, VAT if registered, grand total)
6. Payment info (terms, IBAN, bank, recipient)
7. Legal footer (disclaimers, warranty, withdrawal notice if B2C)
```

**Design:** Clean & minimal. White background, configurable accent color, maximum readability. The document IS the product — it must look better than whatever the tradesperson currently uses.

### 6.7 Sharing & Delivery

**MVP delivery methods:**
1. **Direct download** — PDF saved to device
2. **WhatsApp share** — uses Web Share API → opens WhatsApp with PDF attachment
3. **Email share** — mailto: link with pre-filled subject, user attaches PDF from their email client

**NOT in MVP:** In-app email sending, tracking pixels (VIEWED status), client portal links. These come in Phase 2.

**Status updates in MVP are manual** — user marks quote as Accepted/Declined after hearing back from client.

---

## 7. Data Model

### 7.1 Tables

**Follows established Drizzle patterns:** UUID PKs, varchar(255) for Clerk user IDs, numeric(12,2) for money, jsonb for structured data, timestamp audit fields.

#### `business_profiles`
```
id                    uuid PK
user_id               varchar(255) NOT NULL UNIQUE  -- Clerk ID, one profile per user
company_name          text NOT NULL
registry_code         varchar(20) NOT NULL
address               text NOT NULL
phone                 varchar(50) NOT NULL
email                 text NOT NULL
is_vat_registered     boolean NOT NULL DEFAULT false
kmkr_number           varchar(20)                   -- NULL if not VAT registered
trade_type            varchar(50) NOT NULL           -- enum: electrical, plumbing, hvac, gas, painting, renovation, other
is_mtr_registered     boolean DEFAULT false
mtr_reference         text
iban                  varchar(50) NOT NULL
bank_name             varchar(100) NOT NULL
logo_url              text                           -- R2 URL
default_payment_days  integer NOT NULL DEFAULT 14
default_validity_days integer NOT NULL DEFAULT 14
default_warranty_b2c  text DEFAULT '24 kuud tööde teostamise kuupäevast'
default_warranty_b2b  text DEFAULT 'Garantiitingimused lepitakse kokku eraldi'
invoice_prefix        varchar(20) DEFAULT '2026'
quote_prefix          varchar(20) DEFAULT 'HP'
document_language     varchar(5) NOT NULL DEFAULT 'et'   -- et or en, global for all docs
accent_color          varchar(10) DEFAULT '#2563EB'      -- hex color for documents + UI
created_at            timestamp NOT NULL DEFAULT now()
updated_at            timestamp NOT NULL DEFAULT now()
```

#### `catalog_services`
```
id                    uuid PK
user_id               varchar(255) NOT NULL
name_et               text NOT NULL
name_en               text
category              varchar(100) NOT NULL
unit_price            numeric(12,2) NOT NULL
unit                  varchar(20) NOT NULL           -- h, m2, tk, jm, km, paev
description           text
is_material           boolean NOT NULL DEFAULT false
estimated_minutes     integer
is_active             boolean NOT NULL DEFAULT true
sort_order            integer DEFAULT 0
created_at            timestamp NOT NULL DEFAULT now()
updated_at            timestamp NOT NULL DEFAULT now()

INDEX: (user_id)
INDEX: (user_id, category)
INDEX: (user_id, is_active)
```

#### `clients`
```
id                    uuid PK
user_id               varchar(255) NOT NULL
client_type           varchar(10) NOT NULL           -- b2b, b2c
name                  text NOT NULL
registry_code         varchar(20)                    -- B2B only
kmkr_number           varchar(20)                    -- B2B + VAT only
address               text NOT NULL
email                 text
phone                 varchar(50)
contact_person        text                           -- B2B only
is_einvoice_recipient boolean DEFAULT false
notes                 text
created_at            timestamp NOT NULL DEFAULT now()
updated_at            timestamp NOT NULL DEFAULT now()

UNIQUE INDEX: (user_id, name, registry_code)
INDEX: (user_id)
```

#### `quotes`
```
id                    uuid PK
user_id               varchar(255) NOT NULL
client_id             uuid NOT NULL REFERENCES clients(id)
quote_number          varchar(50) NOT NULL           -- e.g., "HP-2026-001"
status                varchar(20) NOT NULL DEFAULT 'draft'
                      -- draft, sent, viewed, accepted, declined, expired, invoiced

-- Document content (snapshot at time of creation)
client_snapshot       jsonb NOT NULL                 -- frozen client info
business_snapshot     jsonb NOT NULL                 -- frozen business info
line_items            jsonb NOT NULL                 -- [{description, qty, unit, unitPrice, total, isMaterial, catalogServiceId}]
notes                 text                           -- free-form notes on quote
ai_job_description    text                           -- original job description input

-- Financial
subtotal              numeric(12,2) NOT NULL
vat_rate              numeric(5,2)                   -- 24.00 or NULL if not VAT
vat_amount            numeric(12,2)                  -- NULL if not VAT
total                 numeric(12,2) NOT NULL

-- Terms
validity_days         integer NOT NULL
valid_until           timestamp NOT NULL
payment_terms_days    integer NOT NULL
warranty_text         text
disclaimer_text       text NOT NULL                  -- non-binding clause
additional_work_clause text NOT NULL                 -- VÕS § 639
material_clause       text                           -- optional material price fluctuation
withdrawal_notice     text                           -- B2C only

-- Metadata
issued_at             timestamp NOT NULL DEFAULT now()
accepted_at           timestamp
declined_at           timestamp
expired_at            timestamp
created_at            timestamp NOT NULL DEFAULT now()
updated_at            timestamp NOT NULL DEFAULT now()

INDEX: (user_id, status)
INDEX: (user_id, created_at)
UNIQUE INDEX: (user_id, quote_number)
```

#### `invoices`
```
id                    uuid PK
user_id               varchar(255) NOT NULL
client_id             uuid NOT NULL REFERENCES clients(id)
quote_id              uuid REFERENCES quotes(id)     -- NULL if invoice created independently
invoice_number        varchar(50) NOT NULL           -- e.g., "2026-001"

-- Document content (snapshot)
client_snapshot       jsonb NOT NULL
business_snapshot     jsonb NOT NULL
line_items            jsonb NOT NULL
notes                 text

-- Financial
subtotal              numeric(12,2) NOT NULL
vat_rate              numeric(5,2)                   -- 24.00 or NULL
vat_amount            numeric(12,2)                  -- NULL if not VAT
total                 numeric(12,2) NOT NULL

-- Dates
invoice_date          timestamp NOT NULL DEFAULT now()
service_date          timestamp                      -- KMS § 37(7) point 7: if ≠ invoice date
due_date              timestamp NOT NULL
payment_terms_days    integer NOT NULL

-- Status
status                varchar(20) NOT NULL DEFAULT 'issued'
                      -- issued, sent, paid, overdue, cancelled
paid_at               timestamp
cancelled_at          timestamp

-- Metadata
created_at            timestamp NOT NULL DEFAULT now()
updated_at            timestamp NOT NULL DEFAULT now()

UNIQUE INDEX: (user_id, invoice_number)
INDEX: (user_id, status)
INDEX: (user_id, due_date)
```

#### `invoice_counters`
```
id                    uuid PK
user_id               varchar(255) NOT NULL UNIQUE
current_invoice_number integer NOT NULL DEFAULT 0
current_quote_number   integer NOT NULL DEFAULT 0
updated_at            timestamp NOT NULL DEFAULT now()
```

#### `document_files`
```
id                    uuid PK
user_id               varchar(255) NOT NULL
document_type         varchar(20) NOT NULL           -- quote, invoice (expandable: advance_invoice, credit_note, acceptance_act, etc.)
document_id           uuid NOT NULL                  -- references quotes.id or invoices.id
file_url              text NOT NULL                  -- R2 URL
file_name             text NOT NULL
file_size             integer
created_at            timestamp NOT NULL DEFAULT now()

INDEX: (user_id, document_type, document_id)
```

### 7.2 Key Design Decisions

1. **Snapshots on documents:** `client_snapshot` and `business_snapshot` freeze the data at document creation time. If the user later changes their address or a client's KMKR, existing quotes/invoices remain as-issued. This is legally required — issued documents are immutable records.

2. **Line items as JSONB:** Flexible, no join overhead, and quotes/invoices are read-heavy documents. Schema:
```typescript
type LineItem = {
  description: string;
  quantity: number;
  unit: string;          // h, m2, tk, jm, km, paev
  unitPrice: number;
  total: number;
  isMaterial: boolean;
  catalogServiceId?: string;  // link to catalog for analytics
}
```

3. **Separate invoice counter table:** Ensures sequential numbering survives concurrent requests. Uses `UPDATE ... RETURNING` with transaction isolation.

4. **Document files table:** Decoupled from quotes/invoices so we can later add advance invoices, credit notes, acceptance acts without schema changes.

5. **No soft delete on invoices:** Invoices cannot be deleted (7-year retention, RPS § 12). They can only be `cancelled` (and a credit note issued in Phase 3). Quotes can be soft-deleted (drafts only).

---

## 8. API Design

### 8.1 Endpoints

All protected routes use `auth()` from Clerk. Response format: `{ data: T }` on success, `{ error: string }` on failure.

| Method | Path | Purpose |
|--------|------|---------|
| **Business Profile** | | |
| GET | `/api/profile` | Get user's business profile |
| POST | `/api/profile` | Create business profile (onboarding) |
| PUT | `/api/profile` | Update business profile |
| POST | `/api/profile/logo` | Upload logo to R2 |
| **Service Catalog** | | |
| GET | `/api/services` | List all services (active + archived) |
| POST | `/api/services` | Create service |
| PUT | `/api/services/[id]` | Update service |
| DELETE | `/api/services/[id]` | Archive service (soft delete) |
| POST | `/api/services/suggest` | AI suggests services based on trade type |
| **Clients** | | |
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client |
| PUT | `/api/clients/[id]` | Update client |
| DELETE | `/api/clients/[id]` | Delete client (only if no quotes/invoices) |
| GET | `/api/clients/search?q=` | Äriregister autocomplete proxy |
| **Quotes** | | |
| GET | `/api/quotes` | List all quotes (filterable by status) |
| GET | `/api/quotes/[id]` | Get single quote |
| POST | `/api/quotes` | Create quote (manual) |
| POST | `/api/quotes/generate` | AI generate quote (SSE streaming) |
| PUT | `/api/quotes/[id]` | Update quote (draft only) |
| PATCH | `/api/quotes/[id]/status` | Update quote status |
| DELETE | `/api/quotes/[id]` | Delete quote (draft only) |
| POST | `/api/quotes/[id]/duplicate` | Duplicate quote |
| **Invoices** | | |
| GET | `/api/invoices` | List all invoices |
| GET | `/api/invoices/[id]` | Get single invoice |
| POST | `/api/invoices` | Create invoice (from quote or standalone) |
| PATCH | `/api/invoices/[id]/status` | Update invoice status (paid, etc.) |
| **PDF** | | |
| POST | `/api/export/pdf` | Generate PDF from document data |
| **External** | | |
| GET | `/api/ariregister/search?q=` | Proxy to Äriregister autocomplete |

### 8.2 AI Quote Generation (SSE Streaming)

`POST /api/quotes/generate` — uses SSE streaming (same pattern as Prop-Radar/Lead Radar):

```
Request: { clientId, jobDescription, selectedServiceIds?, quantities? }

SSE Events:
  data: { type: "thinking", text: "Analyzing job description..." }
  data: { type: "line_item", item: { description, qty, unit, unitPrice, total, isMaterial } }
  data: { type: "line_item", item: { ... } }
  data: { type: "notes", text: "Estimated duration: 4-6 hours" }
  data: { type: "done", summary: { subtotal, vatAmount, total, itemCount } }
  data: { type: "error", message: "..." }
```

Streaming lets the user see line items appear one by one — feels fast and interactive.

---

## 9. Tech Stack & Architecture

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js (App Router) | Proven across all projects |
| Runtime | React 19 | Latest stable |
| Language | TypeScript 5 | Standard |
| Styling | Tailwind CSS 4 | Standard, clean & minimal design |
| Auth | Clerk | Proven, same pattern as Lead Radar / Prop-Radar |
| Database | Neon PostgreSQL + Drizzle ORM | Proven pattern, serverless, free tier |
| AI | Anthropic Claude Sonnet | Quote generation, service suggestions |
| File Storage | Cloudflare R2 | Logos, generated PDFs. Proven from PicMachine |
| PDF | Puppeteer-Core + @sparticuz/chromium | Proven from ApplyKit. Server-side rendering. |
| i18n | next-intl v4 (ET/EN) | Proven pattern from all projects |
| Hosting | Vercel | Standard |
| PWA | next-pwa or manual manifest | Add-to-homescreen, basic offline indicator |
| Fonts | Inter (UI) + system fonts (documents) | Clean, professional |

### Architecture Diagram

```
Browser (PWA) → Vercel (Next.js App Router)
                  ├── /[locale]/dashboard/*      → Protected pages (Clerk + next-intl)
                  ├── /[locale]/quotes/*          → Quote CRUD pages
                  ├── /[locale]/invoices/*        → Invoice pages
                  ├── /[locale]/settings/*        → Profile, catalog, defaults
                  ├── /api/quotes/generate        → Claude AI (SSE streaming)
                  ├── /api/export/pdf             → Puppeteer PDF generation
                  ├── /api/ariregister/*          → Äriregister proxy
                  └── /api/*                      → Standard CRUD
                ↕
            Clerk Auth (middleware)
                ↕
            Neon PostgreSQL (Drizzle)
                ↕
            Cloudflare R2 (logos, PDFs)
```

### Port: 3003

Following convention: ApplyKit=3000, Prop-Radar=3001, Lead Radar=3002, **QuoteKit=3003**.

Dev command: `npx next dev -p 3003 --webpack`

---

## 10. Estonian Legal Compliance — How It's Baked In

This is not a feature list — it's how the architecture enforces compliance by default.

| Regulation | How It's Enforced | Bypass Possible? |
|------------|-------------------|-----------------|
| Registry code on all docs (Äriseadustik § 15(2)) | Auto-populated from profile. Cannot be removed from PDF template. | NO |
| Quote validity period (VÕS §§ 17-18) | Required field with default. Cannot save quote without it. | NO |
| Non-binding disclaimer (VÕS § 16(2)) | Auto-included on every quote. Text editable, but cannot be fully removed. | NO |
| Additional work clause (VÕS § 639) | Auto-included on every quote. | NO |
| VAT/non-VAT dual mode (KMS § 37 / RPS § 7) | Single toggle controls ALL document output. Templates are fundamentally different. | NO |
| No VAT on non-VAT docs (KMS § 3 lg 5) | Non-VAT template has zero VAT references in code. Not conditional — different template. | IMPOSSIBLE |
| KMKR format validation | EE + 9 digits regex + optional VIES check | NO |
| 10 mandatory invoice fields (KMS § 37(7)) | Template hardcodes all 10 fields. Missing data = validation error, can't generate. | NO |
| Sequential invoice numbering (KMS § 37(7)(1)) | DB counter with transaction isolation. User cannot manually set numbers. | NO |
| Consumer withdrawal notice (VÕS §§ 46-49) | Auto-included when client_type=B2C. | Can be suppressed for exceptions (under €20, urgent repair) |
| Warranty section (VÕS § 642) | Default text auto-included. Editable but present. | CAN remove for B2B |
| Service date on invoice (KMS § 37(7) point 7) | Field present on invoice form. Auto-populated if different from invoice date. | NO |
| 7-year retention (RPS § 12) | Invoices have no delete endpoint. Only status changes allowed. | NO |

---

## 11. Design System

**Direction:** Clean & minimal. White-first, single accent color, maximum readability.

**Principles:**
- Documents are the star — the app exists to make them look great
- Mobile-first — designed for phone screens on job sites
- High contrast — usable in bright outdoor light
- Zero clutter — every element earns its place

**Color palette:**
- Background: white (#FFFFFF) / slate-50 (#F8FAFC) for subtle depth
- Text: slate-900 (#0F172A) primary / slate-500 (#64748B) secondary
- Accent: user-configurable in settings (default: blue-600 #2563EB). Used in UI and document headers.
- Success: emerald-500
- Warning: amber-500
- Error: red-500
- Borders: slate-200 (#E2E8F0)

**Typography:**
- UI + Documents: Inter (clean, readable at all sizes, works for both)

**Document PDF styling:**
- White background, accent color for subtle header elements
- Company logo + info in header
- Clean table for line items
- Bold totals section
- Small footer with legal text

---

## 12. Internationalization

**Same setup as Prop-Radar / Lead Radar:**
- next-intl v4
- Estonian default (`localePrefix: "as-needed"`)
- ET: `/dashboard`, EN: `/en/dashboard`
- Messages in `/messages/et.json` and `/messages/en.json`

**Document language is a global setting:**
- Stored in business profile. One language for all generated documents.
- Separate from UI language (user can browse in English, documents in Estonian)
- Default: Estonian. Can switch to English in settings anytime.
- All legal clauses have ET and EN versions (from REGULATION-FEATURES.md)

---

## 13. Security & GDPR

### Authentication
- Clerk handles all auth (Google + email). Same proven pattern.
- All API routes protected with `auth()` → `userId`
- All DB queries scoped to `userId` — no cross-user data access

### Data Protection (GDPR)
- **Legal basis for processing:** Contract performance (Art. 6(1)(b)) for client data used in invoicing
- **7-year retention:** Invoice records locked, non-deletable (Art. 17(3)(b) exception)
- **Right to deletion:** Delete phone, email, notes. Keep name + amounts on invoices during retention period.
- **Privacy policy:** Required page in both ET and EN (pre-launch requirement)

### Data at Rest
- Neon PostgreSQL: encrypted at rest (Neon default)
- R2: encrypted (Cloudflare default)
- No client data stored in localStorage beyond session

### Sensitive Data
- No payment card data (no Stripe in MVP)
- Bank details (IBAN) stored in profile — user's own data, not sensitive PII
- Client registry codes are public data (Äriregister is public)

---

## 14. Success Metrics

### Launch (first 30 days)
- 5+ tradespeople complete onboarding
- 20+ quotes generated
- At least 1 user sends a real quote to a real client

### Product-Market Fit (90 days)
- 3+ users using it weekly (not just tried once)
- Average time to create quote < 2 minutes
- At least 5 invoices generated from accepted quotes

### Business (6 months)
- 20+ active users
- Ready to flip to paid (Stripe integration)
- At least 1 user acquired via Lead Radar pipeline

---

## 15. Post-MVP Roadmap

### Phase 2 — Power Features
- Photo → Claude Vision analysis → AI generates additional line items
- Voice memo → Whisper transcription → AI line items
- Advance invoices (ettemaksuarve) + reconciliation on final invoice
- Additional work approval flow (client-facing approval link)
- Late payment interest (10.15%/yr) auto-calculation + reminder generation
- €40k VAT threshold tracker with dashboard warnings
- Acceptance act (üleandmise-vastuvõtmise akt) generation
- Stripe billing integration (€29-49/month subscription)
- Quote tracking (VIEWED status via link open tracking)

### Phase 3 — E-Invoice & Scale
- UBL 2.1 XML e-invoice generation alongside PDF
- Finbite integration for e-arve delivery
- Credit note (kreeditarve) support
- Annual accountant export (CSV/PDF summary)
- Client portal (view and accept quotes online)
- Push notifications (PWA)
- Multi-user / team support

---

## 16. Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Äriregister free API rate limit or downtime | Can't auto-fill client data | Cache results, manual fallback input |
| RIK agreement takes >5 working days | No KMKR auto-fill from Äriregister | Use VIES API for KMKR validation, manual entry |
| Claude AI generates incorrect line items | Wrong prices on quotes | AI never auto-sends — user always reviews. Catalog prices used as source of truth. |
| VAT rate changes | Incorrect calculations | Rate stored in profile, admin-configurable, not hardcoded |
| Late interest rate changes (semi-annual) | Wrong interest (Phase 2) | Rate configurable in settings, manual update |
| Puppeteer on Vercel — cold start latency | Slow PDF generation (3-5s first time) | Show loading state, pre-warm in background |
| Free tier limits (Neon, Vercel, R2) | Throttling at scale | Monitor usage, plan for paid tiers before hitting limits |

### External Dependencies
- **Apply for RIK agreement** (Äriregister full API) — free, 5 working day review. Apply before build starts.
- **Clerk project setup** — create new Clerk application for QuoteKit
- **Neon project setup** — create separate database (not shared with other projects)
- **R2 bucket** — create `quotekit` bucket in existing Cloudflare account

---

> **This PRD is the contract.** Nothing gets built until it's approved. No exceptions.
