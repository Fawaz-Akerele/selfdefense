import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  approveSecurityDraft,
  ingestSecurityDraft,
  listSecurityDrafts,
  rejectSecurityDraft,
} from "@/lib/services/scheduling";

export async function GET(request: NextRequest) {
  await requireAdminAccess("security");
  const status = request.nextUrl.searchParams.get("status") ?? "pending_review";
  const drafts = await listSecurityDrafts(status);
  return NextResponse.json({ drafts });
}

const ingestSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  body: z.string().optional(),
  severity: z.string().optional(),
  category: z.string().optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  locationId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  await requireAdminAccess("security");

  try {
    const body = ingestSchema.parse(await request.json());
    const draft = await ingestSecurityDraft(body);
    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ingest failed" },
      { status: 500 }
    );
  }
}

const reviewSchema = z.object({
  draftId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const { user } = await requireAdminAccess("security");

  try {
    const body = reviewSchema.parse(await request.json());

    if (body.action === "approve") {
      const sent = await approveSecurityDraft(body.draftId, user.id, body.notes);
      return NextResponse.json({ ok: true, notificationsSent: sent });
    }

    await rejectSecurityDraft(body.draftId, user.id, body.notes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review failed" },
      { status: 500 }
    );
  }
}
