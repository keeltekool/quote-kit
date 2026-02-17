import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogServices } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

// GET /api/services — list all services
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await db
    .select()
    .from(catalogServices)
    .where(eq(catalogServices.userId, userId))
    .orderBy(asc(catalogServices.category), asc(catalogServices.sortOrder));

  return NextResponse.json({ data: services });
}

// POST /api/services — create a service
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const [service] = await db
    .insert(catalogServices)
    .values({
      userId,
      nameEt: body.nameEt,
      nameEn: body.nameEn || null,
      category: body.category,
      unitPrice: body.unitPrice,
      unit: body.unit,
      description: body.description || null,
      isMaterial: body.isMaterial ?? false,
      estimatedMinutes: body.estimatedMinutes || null,
    })
    .returning();

  return NextResponse.json({ data: service }, { status: 201 });
}
