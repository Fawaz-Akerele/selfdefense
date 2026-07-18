import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { scheduleSessionReminder } from "@/lib/services/reminders";

const schema = z.object({
  sessionId: z.string().uuid(),
  minutesBefore: z.number().int().positive(),
  channel: z.enum(["in_app", "whatsapp", "both"]).default("both"),
  includeDirectionsMap: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to set reminders" }, { status: 401 });
    }

    const body = schema.parse(await request.json());

    const reminder = await scheduleSessionReminder({
      userId: user.id,
      sessionId: body.sessionId,
      minutesBefore: body.minutesBefore,
      channel: body.channel,
      includeDirectionsMap: body.includeDirectionsMap,
    });

    return NextResponse.json({ reminder });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to schedule reminder" },
      { status: 500 }
    );
  }
}
