import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, clients, quotes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getBusinessProfile,
  getNextInvoiceNumber,
} from "@/lib/db/queries";

// GET /api/invoices — list all invoices
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const data = await db
    .select()
    .from(invoices)
    .where(
      status && status !== "all"
        ? and(eq(invoices.userId, userId), eq(invoices.status, status))
        : eq(invoices.userId, userId)
    )
    .orderBy(desc(invoices.createdAt));

  return NextResponse.json({ data });
}

// POST /api/invoices — create invoice (from quote or standalone)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.clientId || !body.lineItems || body.lineItems.length === 0) {
    return NextResponse.json(
      { error: "Client and line items are required" },
      { status: 400 }
    );
  }

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

  // Generate invoice number (atomic)
  const invoiceNumber = await getNextInvoiceNumber(
    userId,
    profile.invoicePrefix || "2026"
  );

  // Calculate totals
  const subtotal = body.lineItems.reduce(
    (sum: number, item: { total: number }) => sum + item.total,
    0
  );
  const vatRate = profile.isVatRegistered ? 24 : null;
  const vatAmount = vatRate ? subtotal * (vatRate / 100) : null;
  const total = subtotal + (vatAmount || 0);

  // Due date
  const paymentTermsDays =
    body.paymentTermsDays || profile.defaultPaymentDays || 14;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

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

  const [invoice] = await db
    .insert(invoices)
    .values({
      userId,
      clientId: body.clientId,
      quoteId: body.quoteId || null,
      invoiceNumber,
      clientSnapshot,
      businessSnapshot,
      lineItems: body.lineItems,
      notes: body.notes || null,
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate?.toFixed(2) || null,
      vatAmount: vatAmount?.toFixed(2) || null,
      total: total.toFixed(2),
      invoiceDate: new Date(),
      serviceDate: body.serviceDate ? new Date(body.serviceDate) : null,
      dueDate,
      paymentTermsDays,
    })
    .returning();

  // If created from a quote, mark it as invoiced
  if (body.quoteId) {
    await db
      .update(quotes)
      .set({ status: "invoiced", updatedAt: new Date() })
      .where(and(eq(quotes.id, body.quoteId), eq(quotes.userId, userId)));
  }

  return NextResponse.json({ data: invoice }, { status: 201 });
}
