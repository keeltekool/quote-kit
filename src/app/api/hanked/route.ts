import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBusinessProfile } from "@/lib/db/queries";

const HANKE_RADAR_API = "https://hanke-radar.onrender.com";

// QuoteKit tradeType → HankeRadar trade tags
const TRADE_MAP: Record<string, string[]> = {
  plumbing: ["plumbing", "hvac"],
  electrical: ["electrical"],
  hvac: ["hvac"],
  gas: ["hvac"],
  painting: ["painting"],
  renovation: ["general", "painting"],
  other: ["general", "plumbing", "electrical", "painting", "hvac", "maintenance"],
};

// GET /api/hanked — proxy to HankeRadar with trade-based filtering
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "active";
  const trade = searchParams.get("trade");
  const region = searchParams.get("region");
  const sort = searchParams.get("sort") || "deadline";
  const page = searchParams.get("page") || "1";

  // Get user's trade type for default filtering
  const profile = await getBusinessProfile(userId);
  const userTrade = profile?.tradeType || "other";
  const tradeTags = TRADE_MAP[userTrade] || TRADE_MAP.other;

  // Build HankeRadar query params
  const params = new URLSearchParams();
  params.set("status", status === "all" ? "" : status);
  params.set("per_page", "50");
  params.set("page", page);

  // Trade filter: use explicit selection or user's profile trades
  if (trade && trade !== "all") {
    params.set("trade", trade);
  } else if (!trade) {
    // Fetch for each matching trade tag and merge
    // For simplicity, use the first/primary trade tag
    params.set("trade", tradeTags[0]);
  }

  if (region && region !== "all") {
    params.set("region", region);
  }

  try {
    const url = `${HANKE_RADAR_API}/procurements?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "HankeRadar API error", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();

    // If user has multiple trade tags and no explicit trade filter, fetch remaining tags
    if (!trade && tradeTags.length > 1) {
      const additionalResults = await Promise.all(
        tradeTags.slice(1).map(async (tag) => {
          const p = new URLSearchParams(params);
          p.set("trade", tag);
          const r = await fetch(`${HANKE_RADAR_API}/procurements?${p.toString()}`, {
            headers: { "Accept": "application/json" },
            next: { revalidate: 300 },
          });
          if (!r.ok) return [];
          const d = await r.json();
          return d.items || [];
        })
      );

      // Merge and deduplicate by id
      const allItems = [...(data.items || [])];
      const seenIds = new Set(allItems.map((item: { id: number }) => item.id));
      for (const items of additionalResults) {
        for (const item of items) {
          if (!seenIds.has(item.id)) {
            allItems.push(item);
            seenIds.add(item.id);
          }
        }
      }

      // Sort
      if (sort === "deadline") {
        allItems.sort((a: { submission_deadline: string }, b: { submission_deadline: string }) => {
          if (!a.submission_deadline) return 1;
          if (!b.submission_deadline) return -1;
          return new Date(a.submission_deadline).getTime() - new Date(b.submission_deadline).getTime();
        });
      } else if (sort === "value") {
        allItems.sort((a: { estimated_value: string | null }, b: { estimated_value: string | null }) => {
          const va = parseFloat(a.estimated_value || "0");
          const vb = parseFloat(b.estimated_value || "0");
          return vb - va;
        });
      } else if (sort === "newest") {
        allItems.sort((a: { publication_date: string }, b: { publication_date: string }) => {
          if (!a.publication_date) return 1;
          if (!b.publication_date) return -1;
          return new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime();
        });
      }

      return NextResponse.json({
        data: allItems,
        total: allItems.length,
        userTrade,
        tradeTags,
      });
    }

    return NextResponse.json({
      data: data.items || [],
      total: data.total || 0,
      userTrade,
      tradeTags,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to HankeRadar" },
      { status: 502 }
    );
  }
}
