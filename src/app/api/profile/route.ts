import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businessProfiles, invoiceCounters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/profile — get current user's business profile
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: profile });
}

// POST /api/profile — create business profile (onboarding)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if profile already exists
  const [existing] = await db
    .select({ id: businessProfiles.id })
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Profile already exists. Use PUT to update." },
      { status: 409 }
    );
  }

  const body = await request.json();

  const [profile] = await db
    .insert(businessProfiles)
    .values({
      userId,
      companyName: body.companyName,
      registryCode: body.registryCode,
      address: body.address,
      phone: body.phone,
      email: body.email,
      isVatRegistered: body.isVatRegistered ?? false,
      kmkrNumber: body.isVatRegistered ? body.kmkrNumber : null,
      tradeType: body.tradeType,
      isMtrRegistered: body.isMtrRegistered ?? false,
      mtrReference: body.mtrReference || null,
      iban: body.iban,
      bankName: body.bankName,
      defaultPaymentDays: body.defaultPaymentDays ?? 14,
      defaultValidityDays: body.defaultValidityDays ?? 14,
      defaultWarrantyB2c: body.defaultWarrantyB2c,
      defaultWarrantyB2b: body.defaultWarrantyB2b,
      invoicePrefix: body.invoicePrefix || new Date().getFullYear().toString(),
      quotePrefix: body.quotePrefix || "HP",
      documentLanguage: body.documentLanguage || "et",
      accentColor: body.accentColor || "#2563EB",
    })
    .returning();

  // Initialize invoice/quote counters
  await db
    .insert(invoiceCounters)
    .values({ userId })
    .onConflictDoNothing();

  return NextResponse.json({ data: profile }, { status: 201 });
}

// PUT /api/profile — update business profile
export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const [profile] = await db
    .update(businessProfiles)
    .set({
      companyName: body.companyName,
      registryCode: body.registryCode,
      address: body.address,
      phone: body.phone,
      email: body.email,
      isVatRegistered: body.isVatRegistered,
      kmkrNumber: body.isVatRegistered ? body.kmkrNumber : null,
      tradeType: body.tradeType,
      isMtrRegistered: body.isMtrRegistered,
      mtrReference: body.mtrReference || null,
      iban: body.iban,
      bankName: body.bankName,
      defaultPaymentDays: body.defaultPaymentDays,
      defaultValidityDays: body.defaultValidityDays,
      defaultWarrantyB2c: body.defaultWarrantyB2c,
      defaultWarrantyB2b: body.defaultWarrantyB2b,
      invoicePrefix: body.invoicePrefix,
      quotePrefix: body.quotePrefix,
      documentLanguage: body.documentLanguage,
      accentColor: body.accentColor,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.userId, userId))
    .returning();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: profile });
}
