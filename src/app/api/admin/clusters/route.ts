import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { confirmCluster, listClustersForAdmin } from "@/lib/services/scheduling";

export async function GET() {
  await requireAdminAccess("scheduling");
  const clusters = await listClustersForAdmin();
  return NextResponse.json({ clusters });
}

const confirmSchema = z.object({
  clusterId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  gymPartnerId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const { user } = await requireAdminAccess("scheduling");

  try {
    const body = confirmSchema.parse(await request.json());
    const sessionId = await confirmCluster({
      clusterId: body.clusterId,
      adminId: user.id,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      gymPartnerId: body.gymPartnerId,
    });

    return NextResponse.json({ ok: true, sessionId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 }
    );
  }
}
