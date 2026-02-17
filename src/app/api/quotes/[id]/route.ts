import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/quotes/[id] — get single quote
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [quote] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .limit(1);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({ data: quote });
}

// PUT /api/quotes/[id] — update quote (draft only)
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

  // Check quote exists and is draft
  const [existing] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft quotes can be edited" },
      { status: 400 }
    );
  }

  // Recalculate totals if line items changed
  const lineItems = body.lineItems || existing.lineItems;
  const subtotal = lineItems.reduce(
    (sum: number, item: { total: number }) => sum + item.total,
    0
  );
  const vatRate = existing.vatRate ? parseFloat(existing.vatRate) : null;
  const vatAmount = vatRate ? subtotal * (vatRate / 100) : null;
  const total = subtotal + (vatAmount || 0);

  const [quote] = await db
    .update(quotes)
    .set({
      lineItems,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount?.toFixed(2) || null,
      total: total.toFixed(2),
      validityDays:
        body.validityDays !== undefined
          ? body.validityDays
          : existing.validityDays,
      paymentTermsDays:
        body.paymentTermsDays !== undefined
          ? body.paymentTermsDays
          : existing.paymentTermsDays,
      warrantyText:
        body.warrantyText !== undefined
          ? body.warrantyText
          : existing.warrantyText,
      materialClause:
        body.materialClause !== undefined
          ? body.materialClause
          : existing.materialClause,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .returning();

  return NextResponse.json({ data: quote });
}

// DELETE /api/quotes/[id] — delete quote (draft only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft quotes can be deleted" },
      { status: 400 }
    );
  }

  await db
    .delete(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)));

  return NextResponse.json({ success: true });
}
