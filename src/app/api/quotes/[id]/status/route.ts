import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/quotes/[id]/status — update quote status
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

  const validStatuses = [
    "draft",
    "sent",
    "viewed",
    "accepted",
    "declined",
    "expired",
    "invoiced",
  ];

  if (!validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  // Set timestamp for specific status transitions
  if (newStatus === "accepted") updates.acceptedAt = new Date();
  if (newStatus === "declined") updates.declinedAt = new Date();
  if (newStatus === "expired") updates.expiredAt = new Date();

  const [quote] = await db
    .update(quotes)
    .set(updates)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .returning();

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({ data: quote });
}
