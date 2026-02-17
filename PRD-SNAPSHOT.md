# QuoteKit — PRD Snapshot

> **Quick resume doc.** Read this first after context reset. Full PRD in `PRD.md`. Legal details in `EE-BUSINESS-RULES.md` and `REGULATION-FEATURES.md`.
>
> Created: 2026-02-16 | PRD approved: 2026-02-16

---

## What Is QuoteKit?

AI-powered **quoting and invoicing app** for Estonian tradespeople (plumbers, electricians, painters, HVAC, general renovation). Mobile-first PWA.

**Core promise:** Tradesperson describes a job (photos, voice, text) → AI generates a professional, legally compliant quote in 60 seconds → sends via WhatsApp/email → tracks status → converts to invoice when work is done.

**Market:** Estonian tradespeople. Zero local competition. Bilingual (ET/EN).

**Revenue model:** SaaS — ~€29-49/month per user.

---

## Why This Exists (Origin Story)

- User built **Lead Radar** — finds businesses with poor online presence, scores them, generates outreach pitches
- Question: "What AI service do I actually SELL to these businesses?"
- Answer: QuoteKit. Lead Radar finds the clients → QuoteKit is the product sold to them
- Also standalone SaaS for any tradesperson who wants professional quoting

---

## Core User Flows

### 1. Onboarding (one-time, 3 min)
Sign up → Business profile wizard (company name, registry code, trade type, VAT status, bank details, logo) → Pick template style → Add common services + default prices → Done

### 2. Create Quote (90 seconds on site)
New Quote → Client info (auto-fill from Äriregister for B2B) → Describe job (photos / voice memo / text) → AI generates line items with prices → Review + adjust → Preview branded PDF → Send via WhatsApp/email/SMS → Saved to dashboard

### 3. Quote Tracking
Dashboard: all quotes with status (Sent → Viewed → Accepted → Declined → Expired). Push notification on accept/decline.

### 4. Quote → Invoice
Work completed → Mark done → Optional acceptance act → Convert to invoice (pre-filled from quote) → Send → Track payment

### 5. Additional Work Flow
Extra work discovered → Create "Additional Work Request" → Send to client for approval → Client approves → Added to final invoice

### 6. Overdue Management
Invoice overdue → Auto-calculate late interest (10.15%/yr) → Generate payment reminder with interest

---

## Key Differentiator: Estonian Legal Compliance Baked In

This is what makes it more than "just a PDF generator." Every document auto-includes:

| Feature | Source |
|---------|--------|
| Validity period on every quote | VÕS §§ 17-18 |
| Non-binding disclaimer | VÕS § 16(2) |
| Additional work clause | VÕS § 639 |
| Correct VAT handling (24% or NO VAT line at all) | KMS § 37 / § 3 |
| All 10 mandatory invoice fields | KMS § 37(7) |
| Registry code on all documents | Äriseadustik § 15(2) |
| Consumer withdrawal notice (B2C) | VÕS §§ 46-49 |
| Warranty section (2yr B2C default) | VÕS § 642 |
| €40k VAT threshold tracker | KMS § 19 |
| Late payment interest calculation | VÕS § 113 |
| Advance invoice support | KMS § 11 |
| Äriregister auto-fill | Free API |
| E-invoice readiness (UBL 2.1) | EN 16931 / 2027 mandate |
| 7-year invoice retention | RPS § 12 |

---

## Tech Stack (Planned)

Reusing proven patterns from existing projects:

| Layer | Technology | Reused From |
|-------|-----------|-------------|
| Framework | Next.js (App Router) + PWA | All projects |
| Auth | Clerk | Lead Radar, Prop-Radar |
| Database | Neon + Drizzle | Lead Radar, Prop-Radar |
| AI | Anthropic Claude (quote generation, voice-to-text analysis) | All projects |
| Photos | Cloudflare R2 | PicMachine |
| PDF | Puppeteer-Core + @sparticuz/chromium | ApplyKit |
| i18n | next-intl (ET/EN) | All projects |
| Voice-to-text | Browser Web Speech API (free) or Whisper | NEW |
| Vision | Claude Vision (analyze job photos) | NEW |
| Company lookup | Äriregister API (free) | NEW |
| Hosting | Vercel | All projects |

---

## Document Types the App Generates

1. **Hinnapakkumine** (Quote) — before work
2. **Ettemaksuarve** (Advance invoice) — when deposit received
3. **Lisatöö taotlus** (Additional work request) — when scope changes
4. **Üleandmise-vastuvõtmise akt** (Acceptance act) — after completion
5. **Arve** (Invoice) — after work
6. **Kreeditarve** (Credit note) — when price decreases
7. **Makseemäälestus** (Payment reminder) — when overdue

---

## Two Invoice Modes (CRITICAL)

| VAT-registered | Non-VAT |
|----------------|---------|
| Shows KMKR number | NO KMKR anywhere |
| Subtotal + KM 24% + Total | Total ONLY |
| 10 mandatory fields (KMS § 37) | Simpler fields (RPS § 7) |
| Advance triggers immediate VAT | No VAT on advance |

**A single VAT toggle in business profile controls all document output.**

---

## APIs to Integrate

| API | Purpose | Cost |
|-----|---------|------|
| Äriregister Autocomplete | Company name lookup | Free, no agreement |
| Äriregister E-invoice check | Check if client needs e-arve | Free, no agreement |
| Äriregister Full Data (RIK agreement) | Auto-fill address + KMKR | Free, apply early |
| VIES | Validate EU VAT numbers | Free |
| Eesti Pank | Late payment interest rate | Manual/semi-annual |
| Finbite (future) | E-invoice delivery | Paid, Phase 2+ |

---

## Build Phases (Rough)

### Phase 1 — MVP
- Business profile + onboarding
- Quote creation (text input → AI line items → PDF)
- Äriregister auto-fill
- Quote sending (WhatsApp/email share)
- Quote dashboard + status tracking
- Invoice generation from accepted quotes
- VAT / non-VAT dual mode
- ET/EN bilingual

### Phase 2 — Power Features
- Photo → AI analysis (Claude Vision)
- Voice memo → transcription → AI line items
- Advance invoices + reconciliation
- Additional work approval flow
- Late payment interest + reminders
- €40k threshold tracker
- Acceptance act generation

### Phase 3 — E-Invoice & Scale
- UBL 2.1 XML generation
- Finbite integration for e-arve delivery
- Credit note support
- Annual accountant export
- Client portal (view/accept quotes online)
- Push notifications (PWA)

---

## Reference Docs in This Folder

| File | Purpose |
|------|---------|
| `PRD-SNAPSHOT.md` | This file — quick resume after context reset |
| `PRD.md` | **Full approved PRD** — 16 sections, data model, API design, all specs |
| `EE-BUSINESS-RULES.md` | Full Estonian regulatory reference (13 sections, all § refs) |
| `REGULATION-FEATURES.md` | Every regulation mapped to concrete app features |

---

## Key Decisions Made

- **Name:** QuoteKit
- **Format:** PWA (not native app) — built with Next.js
- **Market:** Estonian tradespeople, bilingual ET/EN
- **Pricing model:** SaaS (monthly subscription)
- **Sales channel:** Lead Radar finds prospects → QuoteKit is the product
- **No chatbot.** This is a document generation + business management tool.
- **Legal compliance is THE differentiator** — not an afterthought
