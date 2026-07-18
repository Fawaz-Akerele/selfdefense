import { NextRequest, NextResponse } from "next/server";
import { runClusterRefresh } from "@/lib/services/scheduling";
import { ingestSecurityDraft } from "@/lib/services/scheduling";
import { shouldUseMockData } from "@/lib/mock";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = request.nextUrl.searchParams.get("job") ?? "clustering";

  if (job === "clustering") {
    if (shouldUseMockData()) {
      return NextResponse.json({ clustersReady: 1, notificationsQueued: 3, mode: "mock" });
    }
    const result = await runClusterRefresh();
    return NextResponse.json(result);
  }

  if (job === "security-ingest") {
    if (shouldUseMockData()) {
      return NextResponse.json({ ingested: 1, mode: "mock" });
    }
    const draft = await ingestSecurityDraft({
      title: "Area trend digest (automated)",
      summary: "Automated ingest placeholder — replace with AI crawler output in production.",
      severity: "medium",
      category: "general",
      sourceName: "Sydef AI ingest",
      rawPayload: { cron: true, at: new Date().toISOString() },
    });
    return NextResponse.json({ ingested: 1, draftId: (draft as { id: string }).id });
  }

  return NextResponse.json({ error: "Unknown job" }, { status: 400 });
}
