import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// POST /api/services/suggest — AI suggests services based on trade type
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tradeType } = body;

  if (!tradeType) {
    return NextResponse.json(
      { error: "Trade type is required" },
      { status: 400 }
    );
  }

  const tradeNames: Record<string, string> = {
    electrical: "electrician (elektritööd)",
    plumbing: "plumber (torutööd)",
    hvac: "HVAC technician (küte ja ventilatsioon)",
    gas: "gas installer (gaasitööd)",
    painting: "painter/finisher (viimistlustööd)",
    renovation: "general renovation contractor (üldehitus)",
    other: "general tradesperson",
  };

  const tradeName = tradeNames[tradeType] || tradeNames.other;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Generate a starter service catalog for an Estonian ${tradeName}.
Return 10-15 common services as JSON array. Each item must have:
- nameEt: service name in Estonian
- category: category name in Estonian (group related services)
- unitPrice: typical Estonian market price (number, EUR, excl. VAT)
- unit: one of "h", "m²", "tk", "jm", "km", "päev"
- isMaterial: true if this is a material/supply item, false if labor
- description: short description in Estonian (optional, 1 sentence max)

Mix labor and material items. Use realistic Estonian market prices for 2025-2026.
Separate labor from materials. Group by logical categories.

Return ONLY valid JSON array, no markdown, no explanation.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: suggestions });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response" },
      { status: 500 }
    );
  }
}
