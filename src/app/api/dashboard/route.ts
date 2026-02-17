import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, invoices } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/dashboard — aggregate stats + recent items
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run all queries in parallel
  const [quoteStats, invoiceStats, recentQuotes, recentInvoices] =
    await Promise.all([
      // Quote counts by status
      db
        .select({
          status: quotes.status,
          count: sql<number>`count(*)::int`,
          total: sql<string>`coalesce(sum(${quotes.total}), 0)`,
        })
        .from(quotes)
        .where(eq(quotes.userId, userId))
        .groupBy(quotes.status),

      // Invoice counts by status
      db
        .select({
          status: invoices.status,
          count: sql<number>`count(*)::int`,
          total: sql<string>`coalesce(sum(${invoices.total}), 0)`,
        })
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .groupBy(invoices.status),

      // Recent 5 quotes
      db
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          status: quotes.status,
          clientSnapshot: quotes.clientSnapshot,
          total: quotes.total,
          createdAt: quotes.createdAt,
          validUntil: quotes.validUntil,
        })
        .from(quotes)
        .where(eq(quotes.userId, userId))
        .orderBy(sql`${quotes.createdAt} desc`)
        .limit(5),

      // Recent 5 invoices
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          clientSnapshot: invoices.clientSnapshot,
          total: invoices.total,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          paidAt: invoices.paidAt,
        })
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(sql`${invoices.createdAt} desc`)
        .limit(5),
    ]);

  // Aggregate quote stats
  const quoteStatsMap: Record<string, { count: number; total: number }> = {};
  let totalQuotes = 0;
  let totalQuoteValue = 0;
  for (const row of quoteStats) {
    quoteStatsMap[row.status] = {
      count: row.count,
      total: parseFloat(row.total),
    };
    totalQuotes += row.count;
    totalQuoteValue += parseFloat(row.total);
  }

  // Aggregate invoice stats
  const invoiceStatsMap: Record<string, { count: number; total: number }> = {};
  let totalInvoices = 0;
  let totalInvoiceValue = 0;
  for (const row of invoiceStats) {
    invoiceStatsMap[row.status] = {
      count: row.count,
      total: parseFloat(row.total),
    };
    totalInvoices += row.count;
    totalInvoiceValue += parseFloat(row.total);
  }

  // Calculate pending payments (issued + sent invoices)
  const pendingPayments =
    (invoiceStatsMap["issued"]?.total || 0) +
    (invoiceStatsMap["sent"]?.total || 0);
  const pendingCount =
    (invoiceStatsMap["issued"]?.count || 0) +
    (invoiceStatsMap["sent"]?.count || 0);

  // Detect overdue invoices
  const overdueInvoices = recentInvoices.filter(
    (inv) => inv.status === "sent" && new Date(inv.dueDate) < new Date()
  );

  return NextResponse.json({
    data: {
      quotes: {
        total: totalQuotes,
        totalValue: totalQuoteValue,
        byStatus: quoteStatsMap,
      },
      invoices: {
        total: totalInvoices,
        totalValue: totalInvoiceValue,
        byStatus: invoiceStatsMap,
        pendingPayments,
        pendingCount,
        overdueCount: overdueInvoices.length,
      },
      recentQuotes,
      recentInvoices,
    },
  });
}
