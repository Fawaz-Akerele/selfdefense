import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { buildDirectionsSnapshot, formatReminderBody } from "./directions";
import { getSessionWithLocation } from "./locations";
import type { ReminderChannel } from "@/lib/constants/reminders";
import type { InsertTables, Json } from "@/types/database";

export { REMINDER_PRESETS } from "@/lib/constants/reminders";
export type { ReminderChannel } from "@/lib/constants/reminders";

export async function scheduleSessionReminder(input: {
  userId: string;
  sessionId: string;
  bookingId?: string;
  minutesBefore: number;
  channel: ReminderChannel;
  includeDirectionsMap: boolean;
}) {
  const sessionData = await getSessionWithLocation(input.sessionId);
  if (!sessionData?.session) throw new Error("Session not found");

  const { session, cls, loc } = sessionData;
  const startsAt = new Date(session.starts_at);
  const remindAt = new Date(startsAt.getTime() - input.minutesBefore * 60_000);

  if (remindAt <= new Date()) {
    throw new Error("Reminder time is in the past — choose a shorter offset");
  }

  const directionsSnapshot = loc
    ? buildDirectionsSnapshot(loc)
    : buildDirectionsSnapshot({ city: "Unknown", state: "Unknown" });

  const classTitle = cls?.title ?? "Class";
  const admin = tryCreateAdminClient() ?? (await createClient());

  const reminderInsert: InsertTables<"session_reminders"> = {
    user_id: input.userId,
    session_id: input.sessionId,
    booking_id: input.bookingId ?? null,
    remind_at: remindAt.toISOString(),
    channel: input.channel,
    include_directions_map: input.includeDirectionsMap,
    directions_snapshot: directionsSnapshot as unknown as Json,
  };

  const { data, error } = await admin
    .from("session_reminders")
    .insert(reminderInsert)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const notifInsert: InsertTables<"notifications"> = {
    user_id: input.userId,
    title: "Reminder scheduled",
    body: `You'll be reminded before ${classTitle} at ${loc?.venue_name ?? loc?.city ?? "venue"}.`,
    channel: "in_app",
    metadata: { reminderId: data.id, sessionId: input.sessionId } as Json,
  };

  await admin.from("notifications").insert(notifInsert);

  return data;
}

export async function processDueReminders() {
  const admin = tryCreateAdminClient();
  if (!admin) return { processed: 0, errors: [] as string[] };

  const now = new Date().toISOString();

  const { data: due, error } = await admin
    .from("session_reminders")
    .select("*")
    .eq("status", "scheduled")
    .lte("remind_at", now);

  if (error || !due?.length) return { processed: 0, errors: [] };

  const errors: string[] = [];
  let processed = 0;

  for (const reminder of due) {
    try {
      const snapshot = reminder.directions_snapshot as unknown as ReturnType<
        typeof buildDirectionsSnapshot
      >;

      const sessionData = await getSessionWithLocation(reminder.session_id);
      const classTitle = sessionData?.cls?.title ?? "Your class";
      const startsAt = sessionData?.session.starts_at ?? new Date().toISOString();

      const body = formatReminderBody(classTitle, startsAt, snapshot);
      const channel = reminder.channel as ReminderChannel;

      if (channel === "in_app" || channel === "both") {
        const notif: InsertTables<"notifications"> = {
          user_id: reminder.user_id,
          title: `Upcoming: ${classTitle}`,
          body,
          channel: "in_app",
          metadata: {
            reminderId: reminder.id,
            sessionId: reminder.session_id,
            directions: snapshot,
            mapEmbedUrl: snapshot.mapEmbedUrl,
            directionsUrl: snapshot.directionsUrl,
          } as Json,
        };
        await admin.from("notifications").insert(notif);
      }

      if (channel === "whatsapp" || channel === "both") {
        const { data: profile } = await admin
          .from("profiles")
          .select("phone")
          .eq("id", reminder.user_id)
          .single();

        if (profile?.phone) {
          const waLog: InsertTables<"whatsapp_logs"> = {
            phone: profile.phone,
            template_name: "session_reminder",
            message_body: body,
            status: "mock_sent",
            metadata: {
              reminderId: reminder.id,
              includeDirectionsMap: reminder.include_directions_map,
              directionsUrl: snapshot.directionsUrl,
              staticMapUrl: snapshot.staticMapUrl,
            } as Json,
          };
          await admin.from("whatsapp_logs").insert(waLog);
        }
      }

      await admin
        .from("session_reminders")
        .update({ status: "sent", sent_at: now })
        .eq("id", reminder.id);

      processed += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown error");
      await admin
        .from("session_reminders")
        .update({ status: "failed" })
        .eq("id", reminder.id);
    }
  }

  return { processed, errors };
}
