import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/ariregister/search?q=... — proxy to Äriregister autocomplete
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const res = await fetch(
      `https://ariregister.rik.ee/est/api/autocomplete?q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
