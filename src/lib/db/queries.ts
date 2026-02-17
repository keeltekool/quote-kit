import { db } from "@/lib/db";
import { businessProfiles, invoiceCounters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getBusinessProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getOrCreateCounter(userId: string) {
  const [existing] = await db
    .select()
    .from(invoiceCounters)
    .where(eq(invoiceCounters.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [counter] = await db
    .insert(invoiceCounters)
    .values({ userId })
    .returning();
  return counter;
}

export async function getNextQuoteNumber(userId: string, prefix: string) {
  // Atomic increment — no race conditions
  const result = await db.execute(
    `UPDATE invoice_counters SET current_quote_number = current_quote_number + 1, updated_at = NOW() WHERE user_id = '${userId}' RETURNING current_quote_number`
  );

  const num = (result as unknown as { rows: { current_quote_number: number }[] }).rows[0]
    .current_quote_number;
  return `${prefix}-${num.toString().padStart(3, "0")}`;
}

export async function getNextInvoiceNumber(userId: string, prefix: string) {
  const result = await db.execute(
    `UPDATE invoice_counters SET current_invoice_number = current_invoice_number + 1, updated_at = NOW() WHERE user_id = '${userId}' RETURNING current_invoice_number`
  );

  const num = (result as unknown as { rows: { current_invoice_number: number }[] }).rows[0]
    .current_invoice_number;
  return `${prefix}-${num.toString().padStart(3, "0")}`;
}
