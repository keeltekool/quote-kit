import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/invoices/[id]/status — update invoice status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const newStatus = body.status;

  const validStatuses = ["issued", "sent", "paid", "overdue", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === "paid") updates.paidAt = new Date();
  if (newStatus === "cancelled") updates.cancelledAt = new Date();

  const [invoice] = await db
    .update(invoices)
    .set(updates)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning();

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: invoice });
}
