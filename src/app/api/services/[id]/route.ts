import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogServices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/services/[id] — update a service
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

  const [service] = await db
    .update(catalogServices)
    .set({
      nameEt: body.nameEt,
      nameEn: body.nameEn || null,
      category: body.category,
      unitPrice: body.unitPrice,
      unit: body.unit,
      description: body.description || null,
      isMaterial: body.isMaterial,
      estimatedMinutes: body.estimatedMinutes || null,
      isActive: body.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(catalogServices.id, id), eq(catalogServices.userId, userId)))
    .returning();

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ data: service });
}

// DELETE /api/services/[id] — archive a service (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [service] = await db
    .update(catalogServices)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(catalogServices.id, id), eq(catalogServices.userId, userId)))
    .returning();

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ data: service });
}
