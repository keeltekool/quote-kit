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
  params.set("per_page", "100");  // Max allowed by HankeRadar API
  params.set("page", page);

  if (region && region !== "all") {
    params.set("region", region);
  }

  try {
    // Determine which trade tags to fetch
    let fetchTags: string[];
    if (trade && trade !== "all") {
      // Explicit single trade filter selected by user
      fetchTags = [trade];
    } else if (trade === "all") {
      // "All trades" selected — don't filter by trade at all
      fetchTags = [];
    } else {
      // No trade param — use user's profile trade tags
      fetchTags = tradeTags;
    }

    let allItems: Record<string, unknown>[] = [];

    if (fetchTags.length === 0) {
      // Fetch without trade filter (all trades)
      const res = await fetch(`${HANKE_RADAR_API}/procurements?${params.toString()}`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "HankeRadar API error", status: res.status },
          { status: 502 }
        );
      }
      const data = await res.json();
      allItems = data.items || [];
    } else if (fetchTags.length === 1) {
      // Single trade — simple fetch
      params.set("trade", fetchTags[0]);
      const res = await fetch(`${HANKE_RADAR_API}/procurements?${params.toString()}`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "HankeRadar API error", status: res.status },
          { status: 502 }
        );
      }
      const data = await res.json();
      allItems = data.items || [];
    } else {
      // Multiple trade tags — fetch each and merge/deduplicate
      const results = await Promise.all(
        fetchTags.map(async (tag) => {
          const p = new URLSearchParams(params);
          p.set("trade", tag);
          const r = await fetch(`${HANKE_RADAR_API}/procurements?${p.toString()}`, {
            headers: { "Accept": "application/json" },
            next: { revalidate: 300 },
          });
          if (!r.ok) return [];
          const d = await r.json();
          return (d.items || []) as Record<string, unknown>[];
        })
      );

      // Merge and deduplicate by id
      const seenIds = new Set<number>();
      for (const items of results) {
        for (const item of items) {
          const id = item.id as number;
          if (!seenIds.has(id)) {
            allItems.push(item);
            seenIds.add(id);
          }
        }
      }
    }

    // Sort
    if (sort === "deadline") {
      allItems.sort((a, b) => {
        const da = a.submission_deadline as string | null;
        const db = b.submission_deadline as string | null;
        if (!da) return 1;
        if (!db) return -1;
        return new Date(da).getTime() - new Date(db).getTime();
      });
    } else if (sort === "value") {
      allItems.sort((a, b) => {
        const va = parseFloat((a.estimated_value as string) || "0");
        const vb = parseFloat((b.estimated_value as string) || "0");
        return vb - va;
      });
    } else if (sort === "newest") {
      allItems.sort((a, b) => {
        const pa = a.publication_date as string | null;
        const pb = b.publication_date as string | null;
        if (!pa) return 1;
        if (!pb) return -1;
        return new Date(pb).getTime() - new Date(pa).getTime();
      });
    }

    return NextResponse.json({
      data: allItems,
      total: allItems.length,
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
