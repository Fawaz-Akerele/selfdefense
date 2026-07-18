import { createClient } from "@/lib/supabase/server";
import {
  getMockLocationsGroupedByState,
  getMockSessionsByLocations,
  shouldUseMockData,
} from "@/lib/mock";
import { MOCK_LOCATIONS, MOCK_SESSIONS } from "@/lib/mock/data";
import { buildDirectionsSnapshot } from "./directions";
import type { Tables } from "@/types/database";

export type LocationSession = {
  sessionId: string;
  startsAt: string;
  endsAt: string | null;
  seatsAvailable: number;
  classId: string;
  classTitle: string;
  classSlug: string;
  classType: string;
  priceNgn: number;
  location: {
    id: string;
    state: string;
    city: string;
    venueName: string | null;
    address: string | null;
    landmark: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  directions: ReturnType<typeof buildDirectionsSnapshot>;
};

export async function getSessionsByLocations(
  locationIds: string[]
): Promise<LocationSession[]> {
  if (shouldUseMockData()) {
    return getMockSessionsByLocations(locationIds);
  }
  if (locationIds.length === 0) return [];

  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("class_sessions")
    .select("id, starts_at, ends_at, capacity, seats_booked, class_id, location_id")
    .in("location_id", locationIds)
    .eq("is_cancelled", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error || !sessions?.length) return [];

  const classIds = [...new Set(sessions.map((s) => s.class_id))];
  const locIds = [...new Set(sessions.map((s) => s.location_id).filter(Boolean))] as string[];

  const [{ data: classes }, { data: locations }] = await Promise.all([
    supabase.from("classes").select("*").in("id", classIds).eq("is_published", true),
    supabase.from("locations").select("*").in("id", locIds),
  ]);

  const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
  const locMap = new Map((locations ?? []).map((l) => [l.id, l]));

  const results: LocationSession[] = [];

  for (const session of sessions) {
    const cls = classMap.get(session.class_id);
    const loc = session.location_id ? locMap.get(session.location_id) : null;
    if (!cls || !loc) continue;

    results.push(mapSession(session, cls, loc));
  }

  return results;
}

function mapSession(
  session: Pick<
    Tables<"class_sessions">,
    "id" | "starts_at" | "ends_at" | "capacity" | "seats_booked"
  >,
  cls: Tables<"classes">,
  loc: Tables<"locations">
): LocationSession {
  return {
    sessionId: session.id,
    startsAt: session.starts_at,
    endsAt: session.ends_at,
    seatsAvailable: session.capacity - session.seats_booked,
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

export async function getLocationsGroupedByState() {
  if (shouldUseMockData()) return getMockLocationsGroupedByState();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("state")
    .order("city");

  if (error || !data) return {};

  return data.reduce(
    (acc, loc) => {
      if (!acc[loc.state]) acc[loc.state] = [];
      acc[loc.state].push(loc);
      return acc;
    },
    {} as Record<string, Tables<"locations">[]>
  );
}

export async function getSessionWithLocation(sessionId: string) {
  if (shouldUseMockData()) {
    const session = MOCK_SESSIONS.find((s) => s.sessionId === sessionId);
    if (!session) return null;
    return {
      session: {
        id: session.sessionId,
        starts_at: session.startsAt,
        class_id: session.classId,
        location_id: session.location.id,
      },
      cls: { title: session.classTitle },
      loc: MOCK_LOCATIONS.find((l) => l.id === session.location.id) ?? null,
    };
  }

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, starts_at, class_id, location_id")
    .eq("id", sessionId)
    .single();

  if (!session) return null;

  const [{ data: cls }, { data: loc }] = await Promise.all([
    supabase.from("classes").select("title").eq("id", session.class_id).single(),
    session.location_id
      ? supabase.from("locations").select("*").eq("id", session.location_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return { session, cls, loc };
}
