export const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

export const TIME_BANDS = [
  { start: "06:00", end: "12:00", label: "Morning (6am–12pm)" },
  { start: "12:00", end: "17:00", label: "Afternoon (12–5pm)" },
  { start: "17:00", end: "21:00", label: "Evening (5–9pm)" },
] as const;

export const MODALITIES = [
  { value: "in_person", label: "In person" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export type SessionModality = (typeof MODALITIES)[number]["value"];

export const CLUSTER_STATUS_LABELS: Record<string, string> = {
  forming: "Gathering interest",
  ready: "Ready to schedule",
  confirmed: "Confirmed — book now",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const ALERT_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const ALERT_CATEGORIES = [
  "robbery",
  "kidnapping",
  "protest",
  "terrorism",
  "traffic",
  "general",
] as const;
