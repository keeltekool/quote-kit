import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { quotes, invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateDocumentHtml } from "@/lib/pdf/generate-html";

// POST /api/export/pdf — generate PDF from quote or invoice
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await request.json();
  const { documentType, documentId } = body;

  if (!documentType || !documentId) {
    return new Response(
      JSON.stringify({ error: "documentType and documentId required" }),
      { status: 400 }
    );
  }

  let html: string;
  let fileName: string;

  try {
    if (documentType === "quote") {
      const [quote] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, documentId), eq(quotes.userId, userId)))
        .limit(1);

      if (!quote) {
        return new Response(JSON.stringify({ error: "Quote not found" }), {
          status: 404,
        });
      }

      html = generateDocumentHtml({
        type: "quote",
        documentNumber: quote.quoteNumber,
        date: quote.issuedAt.toISOString(),
        validUntil: quote.validUntil.toISOString(),
        paymentTermsDays: quote.paymentTermsDays,
        businessSnapshot: quote.businessSnapshot,
        clientSnapshot: quote.clientSnapshot,
        lineItems: quote.lineItems,
        subtotal: quote.subtotal,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
        total: quote.total,
        notes: quote.notes,
        warrantyText: quote.warrantyText,
        disclaimerText: quote.disclaimerText,
        additionalWorkClause: quote.additionalWorkClause,
        withdrawalNotice: quote.withdrawalNotice,
      });

      fileName = `Pakkumine_${quote.quoteNumber}`;
    } else if (documentType === "invoice") {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(
          and(eq(invoices.id, documentId), eq(invoices.userId, userId))
        )
        .limit(1);

      if (!invoice) {
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
        });
      }

      html = generateDocumentHtml({
        type: "invoice",
        documentNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString(),
        serviceDate: invoice.serviceDate?.toISOString() || null,
        dueDate: invoice.dueDate.toISOString(),
        paymentTermsDays: invoice.paymentTermsDays,
        businessSnapshot: invoice.businessSnapshot,
        clientSnapshot: invoice.clientSnapshot,
        lineItems: invoice.lineItems,
        subtotal: invoice.subtotal,
        vatRate: invoice.vatRate,
        vatAmount: invoice.vatAmount,
        total: invoice.total,
        notes: invoice.notes,
      });

      fileName = `Arve_${invoice.invoiceNumber}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid documentType" }), {
        status: 400,
      });
    }
  } catch (err) {
    console.error("Document fetch error:", err);
    return new Response(JSON.stringify({ error: "Failed to load document" }), {
      status: 500,
    });
  }

  // Generate PDF with Puppeteer
  let browser = null;

  try {
    const puppeteer = await import("puppeteer-core");

    const isVercel =
      !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    let executablePath: string;
    let args: string[];

    if (isVercel) {
      const chromium = await import("@sparticuz/chromium");
      executablePath = await chromium.default.executablePath();
      args = chromium.default.args;
    } else {
      // Local dev: use system Chrome
      executablePath =
        process.env.CHROME_EXECUTABLE_PATH ||
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      args = ["--no-sandbox", "--disable-setuid-sandbox"];
    }

    browser = await puppeteer.default.launch({
      args: isVercel
        ? puppeteer.default.defaultArgs({ args, headless: "shell" })
        : args,
      executablePath,
      headless: "shell",
      defaultViewport: {
        width: 794, // 210mm at 96dpi (A4 width)
        height: 1123, // 297mm at 96dpi (A4 height)
        deviceScaleFactor: 2,
      },
    });

    const page = await browser.newPage();
    await page.emulateMediaType("screen");
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      waitForFonts: true,
    });

    await browser.close();
    browser = null;

    const safeFileName =
      fileName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "document";

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({
        error: "PDF generation failed",
        details: error instanceof Error ? error.message : "",
      }),
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
  }
}
