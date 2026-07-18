import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { saveSchedulingPreference, getUserPreferences, getUserClusters } from "@/lib/services/scheduling";
import { shouldUseMockData } from "@/lib/mock";

const schema = z.object({
  classId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid(),
  modality: z.enum(["in_person", "virtual", "hybrid"]),
  preferredDays: z.array(z.number().int().min(0).max(6)).min(1),
  timeStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  timeEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  notes: z.string().max(500).optional(),
});

export async function GET() {
  if (shouldUseMockData()) {
    return NextResponse.json({
      preferences: [
        {
          id: "mock-pref-1",
          modality: "in_person",
          preferred_days: [1, 3, 5],
          locations: { city: "Ikeja", state: "Lagos", venue_name: "Sydef Studio — Ikeja" },
        },
      ],
      clusters: [
        {
          id: "mock-cluster-1",
          demand_clusters: { status: "forming", member_count: 5, min_size: 8 },
        },
      ],
    });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const [preferences, clusters] = await Promise.all([
    getUserPreferences(user.id),
    getUserClusters(user.id),
  ]);

  return NextResponse.json({ preferences, clusters });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (shouldUseMockData()) {
    return NextResponse.json({ ok: true, preferenceId: "mock-pref-new" });
  }

  try {
    const body = schema.parse(await request.json());
    const preferenceId = await saveSchedulingPreference({
      userId: user.id,
      classId: body.classId,
      locationId: body.locationId,
      modality: body.modality,
      preferredDays: body.preferredDays,
      timeStart: body.timeStart.length === 5 ? `${body.timeStart}:00` : body.timeStart,
      timeEnd: body.timeEnd.length === 5 ? `${body.timeEnd}:00` : body.timeEnd,
      notes: body.notes,
    });

    return NextResponse.json({ ok: true, preferenceId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save preference" },
      { status: 500 }
    );
  }
}
