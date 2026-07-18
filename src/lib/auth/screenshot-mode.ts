/** @deprecated Import from `@/lib/mock` instead. Re-exports for backward compatibility. */
export {
  isScreenshotMode,
  shouldUseMockData,
  MOCK_USER as SCREENSHOT_MOCK_USER,
  MOCK_PROFILE as SCREENSHOT_MOCK_PROFILE,
  MOCK_LOCATIONS,
  MOCK_SESSIONS as SCREENSHOT_MOCK_SESSIONS,
  MOCK_CLASSES as SCREENSHOT_MOCK_CLASSES,
  MOCK_ARTICLES as SCREENSHOT_MOCK_ARTICLES,
  MOCK_BOOKINGS as SCREENSHOT_MOCK_BOOKINGS,
  MOCK_ANALYTICS as SCREENSHOT_MOCK_ANALYTICS,
  MOCK_PACKAGES as SCREENSHOT_MOCK_PACKAGES,
  MOCK_CORPORATE_ORDERS as SCREENSHOT_MOCK_CORPORATE_ORDERS,
  MOCK_PLATFORM_SETTINGS as SCREENSHOT_MOCK_PLATFORM_SETTINGS,
  MOCK_ENROLLMENTS as SCREENSHOT_MOCK_ENROLLMENTS,
  MOCK_NOTIFICATIONS as SCREENSHOT_MOCK_NOTIFICATIONS,
  getMockFinancialSummary,
} from "@/lib/mock";

import { getMockLocationsGroupedByState } from "@/lib/mock/queries";

/** Legacy shape used by older homepage code. */
export const SCREENSHOT_MOCK_LOCATIONS_BY_STATE = getMockLocationsGroupedByState();

export const SCREENSHOT_MOCK_FINANCIAL_SUMMARY = {
  totalRevenue: 1625000,
  totalRefunds: 45000,
  netRevenue: 1580000,
  transactionCount: 4,
};
