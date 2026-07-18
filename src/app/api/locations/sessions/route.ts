import { NextRequest, NextResponse } from "next/server";
import { getSessionsByLocations } from "@/lib/services/locations";

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.getAll("locationId");

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one locationId" },
        { status: 400 }
      );
    }

    const sessions = await getSessionsByLocations(ids);
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
