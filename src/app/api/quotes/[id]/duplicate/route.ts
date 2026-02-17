import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getBusinessProfile, getNextQuoteNumber } from "@/lib/db/queries";

// POST /api/quotes/[id]/duplicate — duplicate quote as new draft
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get original quote
  const [original] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .limit(1);

  if (!original) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Get fresh business profile and client for updated snapshots
  const profile = await getBusinessProfile(userId);
  if (!profile) {
    return NextResponse.json(
      { error: "Business profile required" },
      { status: 400 }
    );
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, original.clientId), eq(clients.userId, userId)))
    .limit(1);

  // Generate new quote number
  const quoteNumber = await getNextQuoteNumber(
    userId,
    profile.quotePrefix || "HP"
  );

  // Fresh snapshots
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

  const clientSnapshot = client
    ? {
        clientType: client.clientType,
        name: client.name,
        registryCode: client.registryCode || undefined,
        kmkrNumber: client.kmkrNumber || undefined,
        address: client.address,
        email: client.email || undefined,
        phone: client.phone || undefined,
        contactPerson: client.contactPerson || undefined,
      }
    : original.clientSnapshot;

  // Recalculate totals from original line items
  const lineItems = original.lineItems;
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatRate = profile.isVatRegistered ? 24 : null;
  const vatAmount = vatRate ? subtotal * (vatRate / 100) : null;
  const total = subtotal + (vatAmount || 0);

  const validityDays = original.validityDays;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validityDays);

  const [newQuote] = await db
    .insert(quotes)
    .values({
      userId,
      clientId: original.clientId,
      quoteNumber,
      status: "draft",
      clientSnapshot,
      businessSnapshot,
      lineItems,
      notes: original.notes,
      aiJobDescription: original.aiJobDescription,
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate?.toFixed(2) || null,
      vatAmount: vatAmount?.toFixed(2) || null,
      total: total.toFixed(2),
      validityDays,
      validUntil,
      paymentTermsDays: original.paymentTermsDays,
      warrantyText: original.warrantyText,
      disclaimerText: original.disclaimerText,
      additionalWorkClause: original.additionalWorkClause,
      materialClause: original.materialClause,
      withdrawalNotice: original.withdrawalNotice,
    })
    .returning();

  return NextResponse.json({ data: newQuote }, { status: 201 });
}
