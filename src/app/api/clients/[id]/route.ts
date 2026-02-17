import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, quotes, invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/clients/[id] — update a client
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const [client] = await db
    .update(clients)
    .set({
      clientType: body.clientType,
      name: body.name,
      registryCode: body.registryCode || null,
      kmkrNumber: body.kmkrNumber || null,
      address: body.address,
      email: body.email || null,
      phone: body.phone || null,
      contactPerson: body.contactPerson || null,
      isEinvoiceRecipient: body.isEinvoiceRecipient,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .returning();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ data: client });
}

// DELETE /api/clients/[id] — delete client (only if no quotes/invoices)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check for linked quotes
  const [linkedQuote] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(and(eq(quotes.clientId, id), eq(quotes.userId, userId)))
    .limit(1);

  if (linkedQuote) {
    return NextResponse.json(
      { error: "Cannot delete client with existing quotes" },
      { status: 409 }
    );
  }

  // Check for linked invoices
  const [linkedInvoice] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.clientId, id), eq(invoices.userId, userId)))
    .limit(1);

  if (linkedInvoice) {
    return NextResponse.json(
      { error: "Cannot delete client with existing invoices" },
      { status: 409 }
    );
  }

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));

  return NextResponse.json({ data: { deleted: true } });
}
