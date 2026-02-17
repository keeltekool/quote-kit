import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/clients — list all clients
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(asc(clients.name));

  return NextResponse.json({ data: result });
}

// POST /api/clients — create a client
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const [client] = await db
    .insert(clients)
    .values({
      userId,
      clientType: body.clientType,
      name: body.name,
      registryCode: body.registryCode || null,
      kmkrNumber: body.kmkrNumber || null,
      address: body.address,
      email: body.email || null,
      phone: body.phone || null,
      contactPerson: body.contactPerson || null,
      isEinvoiceRecipient: body.isEinvoiceRecipient ?? false,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json({ data: client }, { status: 201 });
}
