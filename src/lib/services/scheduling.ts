import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionModality } from "@/lib/constants/scheduling";
import type { Json } from "@/types/database";

export type SchedulingPreferenceInput = {
  userId: string;
  classId?: string | null;
  locationId: string;
  modality: SessionModality;
  preferredDays: number[];
  timeStart: string;
  timeEnd: string;
  notes?: string;
};

export async function saveSchedulingPreference(input: SchedulingPreferenceInput) {
  const admin = tryCreateAdminClient() ?? (await createClient());

  const { data, error } = await admin.rpc("upsert_scheduling_preference", {
    p_user_id: input.userId,
    p_class_id: input.classId ?? null,
    p_location_id: input.locationId,
    p_modality: input.modality,
    p_preferred_days: input.preferredDays,
    p_time_start: input.timeStart,
    p_time_end: input.timeEnd,
    p_notes: input.notes ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function getUserPreferences(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduling_preferences")
    .select("*, locations(city, state, venue_name), classes(title, slug)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUserClusters(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cluster_members")
    .select(
      "*, demand_clusters(*, locations(city, state, venue_name), classes(title, slug), class_sessions(starts_at, ends_at, id))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function runClusterRefresh() {
  const admin = tryCreateAdminClient();
  if (!admin) return { clustersReady: 0, notificationsQueued: 0 };

  const { data, error } = await admin.rpc("refresh_demand_clusters");
  if (error) throw new Error(error.message);

  const row = (data as { clusters_ready?: number; notifications_queued?: number }[] | null)?.[0];
  return {
    clustersReady: row?.clusters_ready ?? 0,
    notificationsQueued: row?.notifications_queued ?? 0,
  };
}

export async function listClustersForAdmin(status?: string) {
  const admin = tryCreateAdminClient() ?? (await createClient());
  let q = admin
    .from("demand_clusters")
    .select("*, locations(city, state, venue_name), classes(title), gym_partners(name)")
    .order("updated_at", { ascending: false });

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function confirmCluster(input: {
  clusterId: string;
  adminId: string;
  startsAt: string;
  endsAt: string;
  gymPartnerId?: string | null;
}) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const { data, error } = await admin.rpc("confirm_demand_cluster", {
    p_cluster_id: input.clusterId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_admin_id: input.adminId,
    p_gym_partner_id: input.gymPartnerId ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function ingestSecurityDraft(input: {
  title: string;
  summary: string;
  body?: string;
  severity?: string;
  category?: string;
  sourceName?: string;
  sourceUrl?: string;
  locationId?: string | null;
  rawPayload?: Record<string, unknown>;
}) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const { data, error } = await admin
    .from("security_alert_drafts")
    .insert({
      title: input.title,
      summary: input.summary,
      body: input.body ?? null,
      severity: input.severity ?? "medium",
      category: input.category ?? "general",
      source_name: input.sourceName ?? "AI ingest",
      source_url: input.sourceUrl ?? null,
      location_id: input.locationId ?? null,
      ai_confidence: 0.75,
      raw_payload: (input.rawPayload ?? {}) as Json,
      status: "pending_review",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listSecurityDrafts(status = "pending_review") {
  const admin = tryCreateAdminClient() ?? (await createClient());
  const { data, error } = await admin
    .from("security_alert_drafts")
    .select("*, locations(city, state)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function approveSecurityDraft(draftId: string, reviewerId: string, notes?: string) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const { data, error } = await admin.rpc("approve_security_alert", {
    p_draft_id: draftId,
    p_reviewer_id: reviewerId,
    p_notes: notes ?? null,
  });

  if (error) throw new Error(error.message);
  return data as number;
}

export async function rejectSecurityDraft(draftId: string, reviewerId: string, notes?: string) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const { error } = await admin
    .from("security_alert_drafts")
    .update({
      status: "rejected",
      reviewer_id: reviewerId,
      reviewer_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", draftId);

  if (error) throw new Error(error.message);
}
