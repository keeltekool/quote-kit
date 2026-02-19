import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/hanked/create-quote — find or create client from procurement data
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    contractingAuth,
    contractingAuthReg,
    contactPerson,
    contactEmail,
    contactPhone,
    performanceAddress,
  } = body;

  if (!contractingAuth) {
    return NextResponse.json(
      { error: "Contracting authority name is required" },
      { status: 400 }
    );
  }

  // Try to find existing client by registry code
  let client = null;
  if (contractingAuthReg) {
    const [existing] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          eq(clients.registryCode, contractingAuthReg)
        )
      )
      .limit(1);
    client = existing || null;
  }

  // If not found by registry code, try by name
  if (!client) {
    const [existing] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          eq(clients.name, contractingAuth)
        )
      )
      .limit(1);
    client = existing || null;
  }

  // Create new client if not found
  if (!client) {
    const [newClient] = await db
      .insert(clients)
      .values({
        userId,
        clientType: "b2b",
        name: contractingAuth,
        registryCode: contractingAuthReg || null,
        address: performanceAddress || "Eesti",
        email: contactEmail || null,
        phone: contactPhone || null,
        contactPerson: contactPerson || null,
        notes: "Loodud riigihanke kaudu",
      })
      .returning();
    client = newClient;
  }

  return NextResponse.json({ data: { clientId: client.id } });
}
