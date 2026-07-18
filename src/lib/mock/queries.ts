import type { Tables } from "@/types/database";
import type { LedgerRow } from "@/lib/services/financial";
import type { LocationSession } from "@/lib/services/locations";
import {
  MOCK_ANALYTICS,
  MOCK_ARTICLES,
  MOCK_BOOKINGS,
  MOCK_CLASSES,
  MOCK_CORPORATE_ORDERS,
  MOCK_ENROLLMENTS,
  MOCK_FINANCIAL_ROWS,
  MOCK_LOCATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_PACKAGES,
  MOCK_PLATFORM_SETTINGS,
  MOCK_SESSIONS,
  getMockFinancialSummary,
} from "./data";

export function getMockLocationsGroupedByState() {
  return MOCK_LOCATIONS.reduce(
    (acc, loc) => {
      const key = loc.state === "FCT" ? "FCT Abuja" : loc.state;
      if (!acc[key]) acc[key] = [];
      acc[key].push(loc);
      return acc;
    },
    {} as Record<string, Tables<"locations">[]>
  );
}

export function getMockSessionsByLocations(locationIds: string[]): LocationSession[] {
  if (locationIds.length === 0) return MOCK_SESSIONS;
  return MOCK_SESSIONS.filter((s) => locationIds.includes(s.location.id));
}

export function getMockClassesForAdmin() {
  return MOCK_CLASSES.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    price_ngn: c.price_ngn,
    is_published: c.is_published,
  }));
}

export function getMockArticlesForAdmin() {
  return MOCK_ARTICLES;
}

export function getMockBookingsForAdmin() {
  return MOCK_BOOKINGS;
}

export function getMockAnalyticsForAdmin() {
  return MOCK_ANALYTICS;
}

export function getMockPackagesForAdmin() {
  return MOCK_PACKAGES;
}

export function getMockCorporateOrdersForAdmin() {
  return MOCK_CORPORATE_ORDERS;
}

export function getMockPlatformSettings() {
  return MOCK_PLATFORM_SETTINGS;
}

export function getMockEnrollmentsForPortal() {
  return MOCK_ENROLLMENTS;
}

export function getMockBookingsForPortal() {
  return MOCK_BOOKINGS.filter((b) => b.user_id === "00000000-0000-4000-8000-000000000099").map(
    (b) => ({
      id: b.id,
      status: b.status,
      class_id: b.class_id,
      classTitle: b.classTitle,
    })
  );
}

export function getMockNotificationsForPortal() {
  return MOCK_NOTIFICATIONS;
}

export function getMockFinancialLedger(_from: string, _to: string) {
  const rows = MOCK_FINANCIAL_ROWS;
  return { rows, summary: getMockFinancialSummary(rows) };
}

export function getMockClassTitlesMap() {
  return new Map(MOCK_CLASSES.map((c) => [c.id, c.title]));
}
