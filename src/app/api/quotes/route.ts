import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  quotes,
  clients,
  businessProfiles,
  catalogServices,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getBusinessProfile, getNextQuoteNumber } from "@/lib/db/queries";

// GET /api/quotes — list all quotes
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = db
    .select()
    .from(quotes)
    .where(
      status && status !== "all"
        ? and(eq(quotes.userId, userId), eq(quotes.status, status))
        : eq(quotes.userId, userId)
    )
    .orderBy(desc(quotes.createdAt));

  const data = await query;
  return NextResponse.json({ data });
}

// POST /api/quotes — create quote (manual, from reviewed line items)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  if (!body.clientId || !body.lineItems || body.lineItems.length === 0) {
    return NextResponse.json(
      { error: "Client and line items are required" },
      { status: 400 }
    );
  }

  // Get business profile
  const profile = await getBusinessProfile(userId);
  if (!profile) {
    return NextResponse.json(
      { error: "Business profile required" },
      { status: 400 }
    );
  }

  // Get client
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, body.clientId), eq(clients.userId, userId)))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Generate quote number
  const quoteNumber = await getNextQuoteNumber(
    userId,
    profile.quotePrefix || "HP"
  );

  // Calculate totals
  const subtotal = body.lineItems.reduce(
    (sum: number, item: { total: number }) => sum + item.total,
    0
  );
  const vatRate = profile.isVatRegistered ? 24 : null;
  const vatAmount = vatRate ? subtotal * (vatRate / 100) : null;
  const total = subtotal + (vatAmount || 0);

  // Set validity
  const validityDays = body.validityDays || profile.defaultValidityDays || 14;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validityDays);

  // Build snapshots
  const businessSnapshot = {
    companyName: profile.companyName,
    registryCode: profile.registryCode,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    isVatRegistered: profile.isVatRegistered,
    kmkrNumber: profile.kmkrNumber || undefined,
    tradeType: profile.tradeType,
    iban: profile.iban,
    bankName: profile.bankName,
    logoUrl: profile.logoUrl || undefined,
  };

  const clientSnapshot = {
    clientType: client.clientType,
    name: client.name,
    registryCode: client.registryCode || undefined,
    kmkrNumber: client.kmkrNumber || undefined,
    address: client.address,
    email: client.email || undefined,
    phone: client.phone || undefined,
    contactPerson: client.contactPerson || undefined,
  };

  // Warranty based on client type
  const warrantyText =
    client.clientType === "b2c"
      ? profile.defaultWarrantyB2c
      : profile.defaultWarrantyB2b;

  // Legal clauses (always included per PRD — non-negotiable)
  const disclaimerText =
    body.disclaimerText ||
    "Käesolev pakkumine on informatiivne ja ei kujuta endast sidusat pakkumust VÕS § 16 lg 1 tähenduses.";
  const additionalWorkClause =
    body.additionalWorkClause ||
    "Kui töö käigus ilmnevad ettenägematud lisatööd, teavitatakse tellijat enne nende teostamist. Lisatööde hind lepitakse kokku eraldi vastavalt VÕS §-le 639.";
  const withdrawalNotice =
    client.clientType === "b2c"
      ? "Tarbijal on õigus taganeda lepingust 14 päeva jooksul vastavalt VÕS §-dele 46-49."
      : null;

  const [quote] = await db
    .insert(quotes)
    .values({
      userId,
      clientId: body.clientId,
      quoteNumber,
      status: "draft",
      clientSnapshot,
      businessSnapshot,
      lineItems: body.lineItems,
      notes: body.notes || null,
      aiJobDescription: body.aiJobDescription || null,
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate?.toFixed(2) || null,
      vatAmount: vatAmount?.toFixed(2) || null,
      total: total.toFixed(2),
      validityDays,
      validUntil,
      paymentTermsDays: profile.defaultPaymentDays || 14,
      warrantyText: warrantyText || null,
      disclaimerText,
      additionalWorkClause,
      materialClause: body.materialClause || null,
      withdrawalNotice,
    })
    .returning();

  return NextResponse.json({ data: quote }, { status: 201 });
}
