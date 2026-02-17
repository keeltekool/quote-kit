import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businessProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadFile, deleteFile } from "@/lib/r2";

// POST /api/profile/logo — upload logo image
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, WebP, SVG" },
      { status: 400 }
    );
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum 2MB" },
      { status: 400 }
    );
  }

  // Get current profile to delete old logo if exists
  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json(
      { error: "Business profile required" },
      { status: 400 }
    );
  }

  // Delete old logo from R2 if exists
  if (profile.logoUrl) {
    try {
      const oldKey = profile.logoUrl.split("/").slice(-2).join("/");
      await deleteFile(oldKey);
    } catch {
      // Ignore delete errors for old files
    }
  }

  // Upload new logo
  const ext = file.name.split(".").pop() || "png";
  const key = `logos/${userId}/logo-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = await uploadFile(key, buffer, file.type);

  // Update profile with new logo URL
  const [updated] = await db
    .update(businessProfiles)
    .set({ logoUrl, updatedAt: new Date() })
    .where(eq(businessProfiles.userId, userId))
    .returning();

  return NextResponse.json({ data: { logoUrl: updated.logoUrl } });
}

// DELETE /api/profile/logo — remove logo
export async function DELETE() {
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
    return NextResponse.json(
      { error: "Business profile required" },
      { status: 400 }
    );
  }

  // Delete from R2
  if (profile.logoUrl) {
    try {
      const key = profile.logoUrl.split("/").slice(-2).join("/");
      await deleteFile(key);
    } catch {
      // Ignore delete errors
    }
  }

  // Clear logo URL in profile
  await db
    .update(businessProfiles)
    .set({ logoUrl: null, updatedAt: new Date() })
    .where(eq(businessProfiles.userId, userId));

  return NextResponse.json({ data: { logoUrl: null } });
}
