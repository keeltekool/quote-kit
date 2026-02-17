import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { clients, catalogServices, businessProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// POST /api/quotes/generate — AI-assisted quote generation (SSE streaming)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await request.json();
  const { clientId, jobDescription } = body;

  if (!clientId || !jobDescription) {
    return new Response(
      JSON.stringify({ error: "Client and job description required" }),
      { status: 400 }
    );
  }

  // Load context in parallel
  const [profileResult, clientResult, servicesResult] = await Promise.all([
    db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1),
    db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1),
    db
      .select()
      .from(catalogServices)
      .where(
        and(
          eq(catalogServices.userId, userId),
          eq(catalogServices.isActive, true)
        )
      ),
  ]);

  const profile = profileResult[0];
  const client = clientResult[0];
  const services = servicesResult;

  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Business profile required" }),
      { status: 400 }
    );
  }

  if (!client) {
    return new Response(JSON.stringify({ error: "Client not found" }), {
      status: 404,
    });
  }

  // Build service catalog context for AI
  const catalogJson = services.map((s) => ({
    id: s.id,
    name: s.nameEt,
    nameEn: s.nameEn,
    category: s.category,
    unitPrice: parseFloat(s.unitPrice),
    unit: s.unit,
    description: s.description,
    isMaterial: s.isMaterial,
    estimatedMinutes: s.estimatedMinutes,
  }));

  const systemPrompt = `You are a quote generation assistant for Estonian tradespeople.
Generate structured line items based on the job description and the tradesperson's service catalog.

IMPORTANT RULES:
- ALWAYS prefer matching to catalog services (use their exact prices)
- If the job requires services NOT in the catalog, generate new line items but set catalogServiceId to null
- Separate labor and materials into distinct line items
- Never invent prices for catalog services — use catalog prices
- For non-catalog items, estimate reasonable Estonian market prices
- If the description is too vague, return fewer items with a note

OUTPUT: You must respond with ONLY valid JSON, no markdown or extra text.
{
  "lineItems": [
    {
      "description": "Service name in Estonian",
      "quantity": 2,
      "unit": "h",
      "unitPrice": 80.00,
      "total": 160.00,
      "isMaterial": false,
      "catalogServiceId": "uuid-or-null"
    }
  ],
  "notes": "Any observations about the job (in Estonian)"
}`;

  const userPrompt = `BUSINESS: ${profile.companyName}, ${profile.tradeType}
VAT registered: ${profile.isVatRegistered ? "Yes" : "No"}
Client type: ${client.clientType.toUpperCase()}

SERVICE CATALOG:
${JSON.stringify(catalogJson, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Generate appropriate line items for this job. Use catalog services where possible.`;

  // SSE streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        sendEvent({ type: "thinking", text: "Analüüsin töökirjeldust..." });

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const content = response.content[0];
        if (content.type !== "text") {
          sendEvent({ type: "error", message: "Unexpected AI response" });
          controller.close();
          return;
        }

        // Parse the JSON response
        let parsed: {
          lineItems: Array<{
            description: string;
            quantity: number;
            unit: string;
            unitPrice: number;
            total: number;
            isMaterial: boolean;
            catalogServiceId: string | null;
          }>;
          notes?: string;
        };
        try {
          // Handle potential markdown code blocks
          let jsonText = content.text.trim();
          if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          parsed = JSON.parse(jsonText);
        } catch {
          sendEvent({ type: "error", message: "AI response parsing failed" });
          controller.close();
          return;
        }

        // Stream line items one by one for a nice UI effect
        for (const item of parsed.lineItems) {
          // Ensure total is calculated
          item.total = item.quantity * item.unitPrice;
          sendEvent({ type: "line_item", item });
        }

        // Calculate summary
        const subtotal = parsed.lineItems.reduce(
          (sum, item) => sum + item.total,
          0
        );
        const vatRate = profile.isVatRegistered ? 24 : null;
        const vatAmount = vatRate ? subtotal * (vatRate / 100) : null;
        const total = subtotal + (vatAmount || 0);

        if (parsed.notes) {
          sendEvent({ type: "notes", text: parsed.notes });
        }

        sendEvent({
          type: "done",
          summary: {
            subtotal,
            vatRate,
            vatAmount,
            total,
            itemCount: parsed.lineItems.length,
          },
        });
      } catch (err) {
        sendEvent({
          type: "error",
          message: err instanceof Error ? err.message : "Generation failed",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
