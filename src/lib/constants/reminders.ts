export const REMINDER_PRESETS = [
  { label: "15 minutes before", minutes: 15 },
  { label: "1 hour before", minutes: 60 },
  { label: "1 day before", minutes: 24 * 60 },
  { label: "1 week before", minutes: 7 * 24 * 60 },
] as const;

export type ReminderChannel = "in_app" | "whatsapp" | "both";
