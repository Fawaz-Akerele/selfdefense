import type { Tables } from "@/types/database";
import type { LedgerRow } from "@/lib/services/financial";
import type { LocationSession } from "@/lib/services/locations";
import { buildDirectionsSnapshot } from "@/lib/services/directions";

const now = Date.now();

export const MOCK_SUPER_ADMIN_EMAIL = "oadeagbo@gmail.com";

export const MOCK_USER = {
  id: "00000000-0000-4000-8000-000000000099",
  email: "member@sydef.local",
};

export const MOCK_PROFILE = {
  full_name: "Ada Okafor",
  phone: "+2348012345678",
  role: "member" as const,
};

export const MOCK_LOCATIONS: Tables<"locations">[] = [
  {
    id: "loc-lagos-ikeja",
    state: "Lagos",
    city: "Ikeja",
    venue_name: "Sydef Studio — Ikeja",
    address: "12 Allen Avenue, Ikeja",
    landmark: "Near Ikeja City Mall",
    latitude: 6.6018,
    longitude: 3.3515,
    is_active: true,
    created_at: new Date(now - 86400000 * 90).toISOString(),
  },
  {
    id: "loc-lagos-lekki",
    state: "Lagos",
    city: "Lekki",
    venue_name: "Sydef Studio — Lekki Phase 1",
    address: "15 Admiralty Way, Lekki",
    landmark: "Opposite Shoprite",
    latitude: 6.4474,
    longitude: 3.4723,
    is_active: true,
    created_at: new Date(now - 86400000 * 80).toISOString(),
  },
  {
    id: "loc-lagos-yaba",
    state: "Lagos",
    city: "Yaba",
    venue_name: "Sydef Training Hub — Yaba",
    address: "44 Herbert Macaulay Way",
    landmark: "Near Tejuosho Market",
    latitude: 6.5095,
    longitude: 3.3711,
    is_active: true,
    created_at: new Date(now - 86400000 * 70).toISOString(),
  },
  {
    id: "loc-abuja",
    state: "FCT",
    city: "Abuja",
    venue_name: "Sydef Studio — Wuse",
    address: "22 Aminu Kano Crescent, Wuse II",
    landmark: "Close to Banex Plaza",
    latitude: 9.0765,
    longitude: 7.4898,
    is_active: true,
    created_at: new Date(now - 86400000 * 60).toISOString(),
  },
  {
    id: "loc-ph",
    state: "Rivers",
    city: "Port Harcourt",
    venue_name: "Sydef Studio — GRA",
    address: "8 Aba Road, Port Harcourt",
    landmark: "GRA Phase 2",
    latitude: 4.8156,
    longitude: 7.0498,
    is_active: true,
    created_at: new Date(now - 86400000 * 50).toISOString(),
  },
  {
    id: "loc-kano",
    state: "Kano",
    city: "Kano",
    venue_name: "Sydef Training Centre — Kano",
    address: "3 Ahmadu Bello Way",
    landmark: "Central business district",
    latitude: 12.0022,
    longitude: 8.592,
    is_active: true,
    created_at: new Date(now - 86400000 * 40).toISOString(),
  },
  {
    id: "loc-enugu",
    state: "Enugu",
    city: "Enugu",
    venue_name: "Sydef Studio — Enugu",
    address: "5 Ogui Road",
    landmark: "New Haven",
    latitude: 6.4413,
    longitude: 7.4983,
    is_active: true,
    created_at: new Date(now - 86400000 * 30).toISOString(),
  },
];

export const MOCK_CLASSES: Tables<"classes">[] = [
  {
    id: "class-awareness",
    slug: "psychology-of-awareness",
    title: "Psychology of Awareness",
    description: "Read threats early and respond with clarity under pressure.",
    type: "in_person",
    price_ngn: 85000,
    objectives: ["Situational awareness", "Threat cues", "Calm response"],
    instructor_id: null,
    location_id: "loc-lagos-ikeja",
    session_count: 4,
    duration_minutes: 120,
    is_published: true,
    is_corporate_only: false,
    thumbnail_url: null,
    created_at: new Date(now - 86400000 * 120).toISOString(),
    updated_at: new Date(now - 86400000 * 10).toISOString(),
  },
  {
    id: "class-evasion",
    slug: "evasion-and-escape",
    title: "Evasion & Escape Essentials",
    description: "Practical movement, exits, and distance under stress.",
    type: "in_person",
    price_ngn: 95000,
    objectives: ["Exit planning", "Movement", "De-escalation"],
    instructor_id: null,
    location_id: "loc-lagos-lekki",
    session_count: 3,
    duration_minutes: 90,
    is_published: true,
    is_corporate_only: false,
    thumbnail_url: null,
    created_at: new Date(now - 86400000 * 100).toISOString(),
    updated_at: new Date(now - 86400000 * 8).toISOString(),
  },
  {
    id: "class-corporate",
    slug: "corporate-resilience",
    title: "Corporate Resilience Workshop",
    description: "Staff safety training for teams under real-world pressure.",
    type: "corporate",
    price_ngn: 1500000,
    objectives: ["Team protocols", "Workplace threats", "Crisis response"],
    instructor_id: null,
    location_id: "loc-abuja",
    session_count: 2,
    duration_minutes: 180,
    is_published: true,
    is_corporate_only: true,
    thumbnail_url: null,
    created_at: new Date(now - 86400000 * 90).toISOString(),
    updated_at: new Date(now - 86400000 * 5).toISOString(),
  },
  {
    id: "class-online",
    slug: "mind-under-fire",
    title: "Mind Under Fire (Online)",
    description: "Video modules on threat psychology and decision-making.",
    type: "online",
    price_ngn: 45000,
    objectives: ["Psychology", "Decision speed", "Self-regulation"],
    instructor_id: null,
    location_id: null,
    session_count: 6,
    duration_minutes: 45,
    is_published: true,
    is_corporate_only: false,
    thumbnail_url: null,
    created_at: new Date(now - 86400000 * 60).toISOString(),
    updated_at: new Date(now - 86400000 * 3).toISOString(),
  },
];

function buildSession(
  id: string,
  classId: string,
  locationId: string,
  daysFromNow: number,
  seatsBooked: number,
  capacity: number
): LocationSession {
  const cls = MOCK_CLASSES.find((c) => c.id === classId)!;
  const loc = MOCK_LOCATIONS.find((l) => l.id === locationId)!;
  const startsAt = new Date(now + 86400000 * daysFromNow + 3600000 * 10).toISOString();
  const endsAt = new Date(now + 86400000 * daysFromNow + 3600000 * 12).toISOString();

  return {
    sessionId: id,
    startsAt,
    endsAt,
    seatsAvailable: capacity - seatsBooked,
    classId: cls.id,
    classTitle: cls.title,
    classSlug: cls.slug,
    classType: cls.type,
    priceNgn: cls.price_ngn,
    location: {
      id: loc.id,
      state: loc.state,
      city: loc.city,
      venueName: loc.venue_name,
      address: loc.address,
      landmark: loc.landmark,
      latitude: loc.latitude,
      longitude: loc.longitude,
    },
    directions: buildDirectionsSnapshot(loc),
  };
}

export const MOCK_SESSIONS: LocationSession[] = [
  buildSession("sess-1", "class-awareness", "loc-lagos-ikeja", 3, 8, 20),
  buildSession("sess-2", "class-evasion", "loc-lagos-lekki", 5, 12, 24),
  buildSession("sess-3", "class-awareness", "loc-lagos-yaba", 7, 5, 18),
  buildSession("sess-4", "class-corporate", "loc-abuja", 10, 15, 30),
  buildSession("sess-5", "class-evasion", "loc-ph", 12, 6, 16),
  buildSession("sess-6", "class-awareness", "loc-kano", 14, 4, 20),
  buildSession("sess-7", "class-evasion", "loc-enugu", 18, 9, 22),
];

export const MOCK_ARTICLES = [
  { id: "a1", title: "Why situational awareness matters in Nigeria today", status: "published" as const },
  { id: "a2", title: "De-escalation basics for teams and households", status: "published" as const },
  { id: "a3", title: "Kidnap-risk travel protocols for staff", status: "draft" as const },
];

export const MOCK_BOOKINGS = [
  {
    id: "b1",
    status: "confirmed" as const,
    user_id: MOCK_USER.id,
    class_id: "class-awareness",
    profile: MOCK_PROFILE,
    classTitle: "Psychology of Awareness",
  },
  {
    id: "b2",
    status: "pending" as const,
    user_id: "u2",
    class_id: "class-corporate",
    profile: { full_name: "Chidi Nwosu", phone: "+2348098765432" },
    classTitle: "Corporate Resilience Workshop",
  },
  {
    id: "b3",
    status: "completed" as const,
    user_id: "u3",
    class_id: "class-evasion",
    profile: { full_name: "Fatima Bello", phone: "+2347011122233" },
    classTitle: "Evasion & Escape Essentials",
  },
];

export const MOCK_ANALYTICS = [
  { event_name: "location_filter_apply", event_category: "interaction", page_path: "/", created_at: new Date(now - 3600000).toISOString() },
  { event_name: "session_calendar_view", event_category: "interaction", page_path: "/", created_at: new Date(now - 7200000).toISOString() },
  { event_name: "reminder_set", event_category: "conversion", page_path: "/portal", created_at: new Date(now - 86400000).toISOString() },
  { event_name: "checkout_initialize", event_category: "commerce", page_path: "/checkout/mock", created_at: new Date(now - 172800000).toISOString() },
  { event_name: "admin_dashboard_view", event_category: "admin", page_path: "/admin", created_at: new Date(now - 43200000).toISOString() },
];

export const MOCK_PACKAGES = [
  { id: "pkg-1", name: "Team Safety — 25 staff", staff_count: 25, price_ngn: 1500000, is_active: true },
  { id: "pkg-2", name: "Enterprise — 100 staff", staff_count: 100, price_ngn: 5200000, is_active: true },
  { id: "pkg-3", name: "SME Starter — 10 staff", staff_count: 10, price_ngn: 650000, is_active: true },
];

export const MOCK_CORPORATE_ORDERS = [
  { id: "co-1", company_name: "Horizon Bank PLC", status: "paid" as const, staff_count: 25 },
  { id: "co-2", company_name: "Nova Retail Group", status: "pending" as const, staff_count: 100 },
  { id: "co-3", company_name: "Delta Logistics Ltd", status: "fulfilled" as const, staff_count: 10 },
];

export const MOCK_PLATFORM_SETTINGS: Tables<"platform_settings"> = {
  id: "00000000-0000-4000-8000-000000000001",
  mode: "mock",
  site_name: "Sydef",
  site_tagline: "Psychology of Self Defence",
  stripe_configured: false,
  paystack_configured: true,
  flutterwave_configured: true,
  whatsapp_configured: false,
  primary_payment_provider: "paystack",
  secondary_payment_provider: "flutterwave",
  tertiary_payment_provider: "stripe",
  super_admin_email: MOCK_SUPER_ADMIN_EMAIL,
  updated_at: new Date(now).toISOString(),
  updated_by: null,
};

export const MOCK_ENROLLMENTS = [
  { id: "e1", progress_percent: 45, class_id: "class-awareness", title: "Psychology of Awareness" },
  { id: "e2", progress_percent: 10, class_id: "class-online", title: "Mind Under Fire (Online)" },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Class reminder",
    body: "Psychology of Awareness starts tomorrow at 10:00. Tap for directions.",
  },
  {
    id: "n2",
    title: "Payment confirmed",
    body: "Your payment of ₦85,000 was successful. You're enrolled.",
  },
];

export const MOCK_FINANCIAL_ROWS: LedgerRow[] = [
  {
    id: "p1",
    transaction_date: new Date(now - 86400000 * 5).toISOString(),
    amount: 85000,
    currency: "NGN",
    provider: "paystack",
    status: "succeeded",
    purpose: "class_booking",
    customer_name: "Ada Okafor",
    customer_email: null,
  },
  {
    id: "p2",
    transaction_date: new Date(now - 86400000 * 2).toISOString(),
    amount: 1500000,
    currency: "NGN",
    provider: "mock",
    status: "succeeded",
    purpose: "corporate_package",
    customer_name: "Horizon Bank PLC",
    customer_email: null,
  },
  {
    id: "p3",
    transaction_date: new Date(now - 86400000).toISOString(),
    amount: 45000,
    currency: "NGN",
    provider: "flutterwave",
    status: "succeeded",
    purpose: "online_enrollment",
    customer_name: "Fatima Bello",
    customer_email: null,
  },
  {
    id: "p4",
    transaction_date: new Date(now - 86400000 * 8).toISOString(),
    amount: 45000,
    currency: "NGN",
    provider: "paystack",
    status: "refunded",
    purpose: "class_booking",
    customer_name: "Guest booking",
    customer_email: null,
  },
];

export function getMockFinancialSummary(rows: LedgerRow[]) {
  const succeeded = rows.filter((r) => r.status === "succeeded");
  const refunded = rows.filter((r) => r.status === "refunded");
  const totalRevenue = succeeded.reduce((s, r) => s + r.amount, 0);
  const totalRefunds = refunded.reduce((s, r) => s + r.amount, 0);
  const byProvider: Record<string, number> = {};
  const byPurpose: Record<string, number> = {};
  for (const p of succeeded) {
    byProvider[p.provider] = (byProvider[p.provider] ?? 0) + p.amount;
    const purpose = p.purpose ?? "other";
    byPurpose[purpose] = (byPurpose[purpose] ?? 0) + p.amount;
  }
  return {
    totalRevenue,
    totalRefunds,
    netRevenue: totalRevenue - totalRefunds,
    transactionCount: rows.length,
    byProvider,
    byPurpose,
  };
}
