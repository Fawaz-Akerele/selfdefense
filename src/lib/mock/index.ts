import { isSupabaseConfigured } from "@/lib/env";

export function isScreenshotMode() {
  return process.env.SCREENSHOT_MODE === "1";
}

/** Use in-app mock database when Supabase is unavailable or demo mode is on. */
export function shouldUseMockData() {
  return (
    !isSupabaseConfigured() ||
    isScreenshotMode() ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "1"
  );
}

export * from "./data";
export * from "./queries";
export { MOCK_USER, MOCK_SUPER_ADMIN_EMAIL } from "./data";
