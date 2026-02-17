import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  isMaterial: boolean;
  catalogServiceId?: string;
};

export type BusinessSnapshot = {
  companyName: string;
  registryCode: string;
  address: string;
  phone: string;
  email: string;
  isVatRegistered: boolean;
  kmkrNumber?: string;
  tradeType: string;
  iban: string;
  bankName: string;
  logoUrl?: string;
};

export type ClientSnapshot = {
  clientType: string;
  name: string;
  registryCode?: string;
  kmkrNumber?: string;
  address: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
};

// ─── business_profiles ─────────────────────────────────────────────────────

export const businessProfiles = pgTable("business_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  companyName: text("company_name").notNull(),
  registryCode: varchar("registry_code", { length: 20 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: text("email").notNull(),
  isVatRegistered: boolean("is_vat_registered").notNull().default(false),
  kmkrNumber: varchar("kmkr_number", { length: 20 }),
  tradeType: varchar("trade_type", { length: 50 }).notNull(),
  isMtrRegistered: boolean("is_mtr_registered").default(false),
  mtrReference: text("mtr_reference"),
  iban: varchar("iban", { length: 50 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  logoUrl: text("logo_url"),
  defaultPaymentDays: integer("default_payment_days").notNull().default(14),
  defaultValidityDays: integer("default_validity_days").notNull().default(14),
  defaultWarrantyB2c: text("default_warranty_b2c").default(
    "24 kuud tööde teostamise kuupäevast"
  ),
  defaultWarrantyB2b: text("default_warranty_b2b").default(
    "Garantiitingimused lepitakse kokku eraldi"
  ),
  invoicePrefix: varchar("invoice_prefix", { length: 20 }).default("2026"),
  quotePrefix: varchar("quote_prefix", { length: 20 }).default("HP"),
  documentLanguage: varchar("document_language", { length: 5 })
    .notNull()
    .default("et"),
  accentColor: varchar("accent_color", { length: 10 }).default("#2563EB"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── catalog_services ───────────────────────────────────────────────────────

export const catalogServices = pgTable(
  "catalog_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    nameEt: text("name_et").notNull(),
    nameEn: text("name_en"),
    category: varchar("category", { length: 100 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    description: text("description"),
    isMaterial: boolean("is_material").notNull().default(false),
    estimatedMinutes: integer("estimated_minutes"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("catalog_services_user_id_idx").on(table.userId),
    index("catalog_services_user_category_idx").on(
      table.userId,
      table.category
    ),
    index("catalog_services_user_active_idx").on(table.userId, table.isActive),
  ]
);

// ─── clients ────────────────────────────────────────────────────────────────

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    clientType: varchar("client_type", { length: 10 }).notNull(),
    name: text("name").notNull(),
    registryCode: varchar("registry_code", { length: 20 }),
    kmkrNumber: varchar("kmkr_number", { length: 20 }),
    address: text("address").notNull(),
    email: text("email"),
    phone: varchar("phone", { length: 50 }),
    contactPerson: text("contact_person"),
    isEinvoiceRecipient: boolean("is_einvoice_recipient").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("clients_user_name_registry_idx").on(
      table.userId,
      table.name,
      table.registryCode
    ),
    index("clients_user_id_idx").on(table.userId),
  ]
);

// ─── quotes ─────────────────────────────────────────────────────────────────

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    quoteNumber: varchar("quote_number", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"),

    // Document content (snapshot at time of creation)
    clientSnapshot: jsonb("client_snapshot")
      .notNull()
      .$type<ClientSnapshot>(),
    businessSnapshot: jsonb("business_snapshot")
      .notNull()
      .$type<BusinessSnapshot>(),
    lineItems: jsonb("line_items").notNull().$type<LineItem[]>(),
    notes: text("notes"),
    aiJobDescription: text("ai_job_description"),

    // Financial
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
    vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),

    // Terms
    validityDays: integer("validity_days").notNull(),
    validUntil: timestamp("valid_until").notNull(),
    paymentTermsDays: integer("payment_terms_days").notNull(),
    warrantyText: text("warranty_text"),
    disclaimerText: text("disclaimer_text").notNull(),
    additionalWorkClause: text("additional_work_clause").notNull(),
    materialClause: text("material_clause"),
    withdrawalNotice: text("withdrawal_notice"),

    // Metadata
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at"),
    declinedAt: timestamp("declined_at"),
    expiredAt: timestamp("expired_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("quotes_user_number_idx").on(table.userId, table.quoteNumber),
    index("quotes_user_status_idx").on(table.userId, table.status),
    index("quotes_user_created_idx").on(table.userId, table.createdAt),
  ]
);

// ─── invoices ───────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    quoteId: uuid("quote_id").references(() => quotes.id),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),

    // Document content (snapshot)
    clientSnapshot: jsonb("client_snapshot")
      .notNull()
      .$type<ClientSnapshot>(),
    businessSnapshot: jsonb("business_snapshot")
      .notNull()
      .$type<BusinessSnapshot>(),
    lineItems: jsonb("line_items").notNull().$type<LineItem[]>(),
    notes: text("notes"),

    // Financial
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
    vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),

    // Dates
    invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
    serviceDate: timestamp("service_date"),
    dueDate: timestamp("due_date").notNull(),
    paymentTermsDays: integer("payment_terms_days").notNull(),

    // Status — NO DELETE (7-year retention, RPS § 12)
    status: varchar("status", { length: 20 }).notNull().default("issued"),
    paidAt: timestamp("paid_at"),
    cancelledAt: timestamp("cancelled_at"),

    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("invoices_user_number_idx").on(
      table.userId,
      table.invoiceNumber
    ),
    index("invoices_user_status_idx").on(table.userId, table.status),
    index("invoices_user_due_idx").on(table.userId, table.dueDate),
  ]
);

// ─── invoice_counters ───────────────────────────────────────────────────────

export const invoiceCounters = pgTable("invoice_counters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  currentInvoiceNumber: integer("current_invoice_number")
    .notNull()
    .default(0),
  currentQuoteNumber: integer("current_quote_number").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── document_files ─────────────────────────────────────────────────────────

export const documentFiles = pgTable(
  "document_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    documentType: varchar("document_type", { length: 20 }).notNull(),
    documentId: uuid("document_id").notNull(),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("document_files_user_type_doc_idx").on(
      table.userId,
      table.documentType,
      table.documentId
    ),
  ]
);
