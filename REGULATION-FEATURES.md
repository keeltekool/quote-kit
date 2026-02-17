# QuoteKit — Regulation-Driven Features

> **Purpose:** Every feature listed here is derived from Estonian law and MUST be implemented. These aren't nice-to-haves — they're legal requirements that make or break the app's credibility. Missing any of these = a tradesperson's accountant rejects the output = app is dead.
>
> Reference: `EE-BUSINESS-RULES.md` for the full legal basis of each item.
>
> Last updated: 2026-02-16

---

## QUOTE TEMPLATE — Baked-In Rules

### Q1. Validity Period — ALWAYS EXPLICIT
**Law:** VÕS §§ 17-18
**Rule:** Every quote MUST have an explicit expiry date. Never blank.
**Default:** 14 days from issue date (user-configurable).
**Why:** Without it, under VÕS § 18, a quote sent by email is valid for a vague "reasonable time" — creates legal ambiguity the tradesperson doesn't want.

### Q2. Non-Binding Disclaimer
**Law:** VÕS § 16(2)
**Rule:** Default disclaimer text on every quote, clearly stating it is NOT automatically a binding offer.
**Default text (ET):**
```
Käesolev hinnapakkumine on informatiivse iseloomuga.
Lõplik hind täpsustatakse peale tööde mahu kinnitamist.
Lisatööde korral lepitakse hind eraldi kokku.
```
**Default text (EN):**
```
This quote is informational. Final price confirmed after scope
verification. Additional work priced separately by agreement.
```
**Configurable:** Yes — tradesperson can toggle stricter or looser language.

### Q3. Additional Work Clause
**Law:** VÕS § 639 (binding estimate presumption)
**Rule:** Every quote MUST include a clause that additional work beyond scope requires separate agreement.
**Why:** Without it, VÕS § 639(1) PRESUMES the quoted price is the maximum. If tradesperson does extra work without prior agreement and without this clause, they legally cannot charge for it.

### Q4. Material Price Fluctuation Clause
**Rule:** Optional but strongly recommended clause for quotes with significant material costs.
**Default text (ET):**
```
Materjalide hinnad võivad muutuda vastavalt tarnija
hinnamuutustele. Olulise hinnamuutuse korral teavitame
Teid enne tööde alustamist.
```
**Why:** Protects tradesperson if material costs change between quote and work start.

### Q5. Registry Code on EVERY Document
**Law:** Äriseadustik § 15(2)
**Rule:** Company registry code (registrikood) is MANDATORY on all business documents — quotes, invoices, emails, letterheads. Not optional.
**Implementation:** Auto-populated from business profile. Cannot be removed from template.

### Q6. VAT Number — Show or Hide Based on Registration
**Law:** KMS § 37(7), KMS § 3 lg 5
**Rule:**
- VAT-registered → show KMKR number prominently
- NOT VAT-registered → **DO NOT show any VAT number, not even "KMKR: -"**
**Implementation:** Single toggle in business profile controls this across all documents.

### Q7. VAT Lines — Completely Different Output
**Law:** KMS § 37(7) vs RPS § 7
**Rule:**
- VAT-registered → show: subtotal, VAT 24%, total incl. VAT
- NOT registered → show: total ONLY. **NO VAT LINE AT ALL.** Not "KM 0%", not "käibemaks: €0.00" — completely absent.
**Why:** If a non-VAT business shows any VAT on an invoice, they become liable for that amount to the state (KMS § 3 lg 5). The app must make this mistake IMPOSSIBLE.

### Q8. Separate Labor vs Materials Lines
**Rule:** Best practice (not strictly required by law, but expected by Estonian accountants and makes VAT handling clean).
**Why:** Clear breakdown builds trust, helps client understand cost, and makes potential disputes about materials vs labor easier to resolve.

### Q9. B2C Consumer Withdrawal Notice
**Law:** VÕS §§ 46-49
**Rule:** When quote is for a PRIVATE PERSON (eraisik) and contract is concluded at their home (which is 99% of trades work):
- Auto-include 14-day withdrawal right notice
- Checkbox: "Client acknowledged withdrawal right"
**Exceptions (auto-detect):**
- Quote under €20 → no notice needed
- "Urgent repair" flagged → no notice needed (but only for originally requested work)
**Default text (ET):**
```
TAGANEMISÕIGUS: Teil on õigus käesolevast lepingust taganeda
14 päeva jooksul ilma põhjust esitamata, vastavalt VÕS § 49.
```

### Q10. Warranty Section
**Law:** VÕS § 642, TsÜS § 146
**Rule:** Every quote SHOULD include warranty terms.
**Defaults:**
- B2C: "Garantii: 24 kuud tööde teostamise kuupäevast" (24 months from completion)
- B2B: "Garantiitingimused lepitakse kokku eraldi" (warranty terms agreed separately)
**Why:** For B2C, 2-year reversed burden of proof exists BY LAW regardless — but stating it builds trust. For B2B, warranty only exists if agreed in writing (post-2015 Ehitusseadustik change).

### Q11. Payment Terms + Bank Details
**Rule:** Every quote must include:
- Payment method: bank transfer (standard in Estonia)
- IBAN number
- Payment term (default: 14 days)
**Why:** Makes the quote actionable — client knows exactly how to pay when accepting.

---

## INVOICE TEMPLATE — Baked-In Rules

### I1. All 10 Mandatory Fields (VAT-Registered)
**Law:** KMS § 37(7)
**Fields:** See EE-BUSINESS-RULES.md Section 2.1A. All 10 must be present. Missing any = invoice can be rejected by buyer's accountant or EMTA audit.

### I2. Non-VAT Invoice — Completely Different Template
**Law:** RPS § 7
**Rule:** Separate template with NO VAT references anywhere. Not a modified version of the VAT template with zeroes — a fundamentally different document.

### I3. Sequential Invoice Numbering
**Law:** KMS § 37(7)(1)
**Rule:** Automatic, sequential, unique. Format configurable (e.g., `2026-001`). No duplicates allowed. Gaps should be minimized and logged (cancelled invoices).
**Implementation:** App manages numbering. User cannot manually set arbitrary numbers. Counter stored in DB per user.

### I4. 7-Day Issuance Deadline Warning
**Law:** KMS § 37
**Rule:** Invoice must be issued within 7 calendar days of service delivery.
**Implementation:** After marking a quote as "work completed" — show countdown/reminder. "Invoice must be issued by [date]."

### I5. Service Date Field
**Law:** KMS § 37(7) point 7
**Rule:** If the date of service delivery differs from invoice date, the service date MUST appear separately on the invoice.
**Implementation:** Auto-populate from "work completed" date. If same as invoice date, can be omitted.

### I6. Late Payment Interest Auto-Calculation
**Law:** VÕS § 113
**Rule:** After invoice due date passes, interest accrues automatically at 10.15%/year (as of H1 2026). No reminder needed — it's automatic by law.
**Implementation:**
- Track invoice due dates
- On overdue invoices, show accrued interest
- "Generate payment reminder" button that includes interest calculation
- Interest rate configurable (updates semi-annually via Eesti Pank)

### I7. Advance Invoice (Ettemaksuarve)
**Law:** KMS § 11 lg 1 p 2
**Rule:** When advance payment is received:
- VAT-registered: VAT due immediately, invoice within 7 days
- Clearly marked as "Ettemaksuarve" (advance invoice)
- Final invoice must reconcile: total - advance = remaining
**Implementation:** "Request advance" flow on accepted quotes. Advance invoice type. Link advance → final invoice.

### I8. Credit Note Support
**Law:** KMS § 29(7)
**Rule:** When price decreases or service wasn't fully delivered → issue credit note (kreeditarve), not just a modified invoice.
- Must reference original invoice
- Must be clearly labeled "Kreeditarve"
- Cannot be used just because client didn't pay

---

## BUSINESS PROFILE — Baked-In Rules

### B1. VAT Status Toggle — Controls EVERYTHING
**Rule:** Single setting: "Olen käibemaksukohustuslane" (I am VAT-registered) YES/NO.
**Impact:** This toggle controls:
- Whether KMKR field appears on documents
- Whether VAT lines appear on quotes/invoices
- Whether advance payment triggers VAT obligation
- Invoice template selection (VAT vs non-VAT)
**CRITICAL:** This must be impossible to set incorrectly. If YES → require valid KMKR number entry (validate format EE + 9 digits, optionally validate via VIES).

### B2. Trade Type → Document Enrichment
**Rule:** Based on selected trade:
- Regulated trades (electrical, plumbing, HVAC, gas) → prompt for MTR details, show on documents
- Unregulated trades (painting, general finishing) → no MTR prompt
- Electrical specifically → prompt for competence certificate class (A/B/B1/C)

### B3. €40,000 Threshold Tracker
**Law:** KMS § 19
**Rule:** For non-VAT businesses: track annual invoiced turnover. When approaching €40,000 → WARNING: "You are approaching the VAT registration threshold. You must register within 3 working days of exceeding €40,000."
**Implementation:** Running total of invoiced amounts per calendar year. Alert at €35,000 (heads up) and €38,000 (urgent).

---

## CLIENT MANAGEMENT — Baked-In Rules

### C1. Äriregister Auto-Fill
**Rule:** When creating a B2B client:
- Type company name → autocomplete from Äriregister API
- Select → auto-fill: registry code, address, KMKR number
- Check: is this company an e-invoice recipient?
**API:** `ariregister.rik.ee/est/api/autocomplete?q=` (free, no agreement)

### C2. B2B vs B2C Client Type
**Rule:** Every client marked as either:
- **Ettevõte** (company/B2B) → registry code required, KMKR optional, e-invoice check
- **Eraisik** (private person/B2C) → no registry code, consumer protection rules apply, withdrawal notice on quotes
**Impact:** Controls which legal protections appear on documents.

### C3. E-Invoice Recipient Check
**Law:** Since July 2025, if a client company is registered as e-invoice receiver, you MUST send e-arve if they request it.
**Implementation:** On client creation (B2B), check Äriregister e-invoice recipient list. If yes → flag. Show warning on invoice: "This client accepts e-invoices. PDF may not be sufficient."

---

## QUOTE-TO-INVOICE FLOW — Baked-In Rules

### F1. Additional Work Approval Flow
**Law:** VÕS § 639
**Rule:** If tradesperson needs to do work beyond original quote:
1. App creates "Lisatöö taotlus" (additional work request)
2. Shows: what extra work, estimated cost, reason
3. Sends to client for approval (email/SMS link)
4. Client approves → logged with timestamp
5. Only approved additional work appears on final invoice
**Why:** Without documented client approval, VÕS § 639(3) says contractor CANNOT charge for overruns.

### F2. Work Completion + Acceptance
**Rule:** When work is done:
1. Mark quote as "Tööd teostatud" (work completed)
2. Optional: generate "Üleandmise-vastuvõtmise akt" (handover-acceptance act) — starts warranty clock
3. 7-day invoice countdown begins
4. Convert to invoice (pre-filled from quote data)

### F3. Quote Status Lifecycle
```
DRAFT → SENT → VIEWED → ACCEPTED → IN PROGRESS → COMPLETED → INVOICED
                  ↓
               DECLINED
                  ↓
               EXPIRED (auto, based on validity date)
```

---

## DASHBOARD / OVERVIEW — Baked-In Rules

### D1. VAT Threshold Tracker (Non-VAT Businesses Only)
**Display:** Progress bar showing annual turnover vs €40,000 threshold.
**Alerts:** At €35k and €38k.

### D2. Overdue Invoice Tracker
**Display:** List of invoices past due date.
**Show:** Days overdue + accrued interest at 10.15%/year.
**Action:** "Send reminder" (auto-generates reminder with interest calculation).

### D3. Invoice Deadline Tracker
**Display:** Quotes marked "completed" where invoice hasn't been issued yet.
**Alert:** "Invoice must be issued within 7 days of service delivery" countdown.

### D4. Annual Summary for Accountant
**Display:** Downloadable summary of:
- All invoices issued (chronological, sequential)
- Total turnover (for VAT threshold monitoring)
- VAT collected (for VAT return / KMD declaration)
- Advance payments and reconciliations

---

## PDF OUTPUT — Baked-In Rules

### P1. Estonian Document Structure
Standard Estonian business document layout:
```
┌──────────────────────────────────────┐
│  [LOGO]     COMPANY NAME             │
│             Registry: 12345678       │
│             KMKR: EE123456789        │  ← only if VAT-registered
│             Address                  │
│             Phone / Email            │
│──────────────────────────────────────│
│  HINNAPAKKUMINE / ARVE  nr HP-2026-001  │
│  Kuupäev: 16.02.2026                │
│  Kehtib kuni: 02.03.2026            │  ← quotes only
│──────────────────────────────────────│
│  Klient: [name]                      │
│  Reg.nr: [if B2B]                    │
│  KMKR: [if B2B + VAT registered]    │
│  Aadress: [address]                  │
│──────────────────────────────────────│
│                                      │
│  Nr | Kirjeldus | Kogus | Ühik | Hind | Summa  │
│  1  | Töö: ...  |  2h   | h    | €80  | €160   │
│  2  | Materjal: |  1tk  | tk   | €45  | €45    │
│                                      │
│──────────────────────────────────────│
│  IF VAT-REGISTERED:                  │
│    Summa ilma KM-ta:     €205.00     │
│    Käibemaks 24%:         €49.20     │
│    KOKKU:                €254.20     │
│                                      │
│  IF NOT VAT-REGISTERED:              │
│    KOKKU:                €205.00     │
│    [no VAT lines at all]             │
│──────────────────────────────────────│
│  Maksetingimused: 14 päeva           │
│  Pangakonto: EE38 2200 ...          │
│  Saaja: Company Name OÜ             │
│──────────────────────────────────────│
│  [Disclaimers / warranty / notes]    │
│  [Consumer withdrawal notice if B2C] │
└──────────────────────────────────────┘
```

### P2. Document Types the App Must Generate

| Document | Estonian Name | When |
|----------|-------------|------|
| Quote | Hinnapakkumine | Before work |
| Acceptance act | Üleandmise-vastuvõtmise akt | After work completion (optional) |
| Advance invoice | Ettemaksuarve | When deposit received |
| Invoice | Arve | After work completion |
| Credit note | Kreeditarve | When price decreases / partial service |
| Payment reminder | Makseemäälestus | When invoice overdue |
| Additional work request | Lisatöö taotlus | When scope changes discovered |

---

## NUMBERS & CALCULATIONS — Baked-In Rules

### N1. VAT Calculation
```
VAT-registered:
  subtotal = sum of all line items (excl. VAT)
  vat_amount = subtotal × 0.24
  total = subtotal + vat_amount

Non-VAT:
  total = sum of all line items
  [no VAT calculation at all]
```

### N2. Late Interest Calculation
```
days_overdue = today - due_date
daily_rate = 10.15 / 365 / 100  // = 0.00027808
interest = invoice_amount × daily_rate × days_overdue
```
Update rate semi-annually from Eesti Pank.

### N3. Advance Payment Reconciliation
```
Final invoice:
  total_work = original_quote_amount [+ approved_additions]
  vat = total_work × 0.24  // if VAT-registered
  total_with_vat = total_work + vat
  less_advance = advance_amount_paid
  remaining = total_with_vat - less_advance
```

### N4. VAT Threshold Tracking
```
annual_turnover = SUM(all invoiced amounts excl. VAT, current calendar year)
if annual_turnover >= 35000 → yellow warning
if annual_turnover >= 38000 → red warning
if annual_turnover >= 40000 → CRITICAL: "Register for VAT within 3 working days"
```

---

> **BUILD PRINCIPLE:** When in doubt, be MORE compliant than necessary. An overly formal quote impresses a client. A legally incorrect invoice kills the business relationship. The app should make doing the right thing the default — users shouldn't have to think about regulations, the templates should handle it.
