import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export async function listPublicPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*, plan_entitlements(*)")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUserActiveSubscription(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_subscriptions")
    .select("*, pricing_plans(*, plan_entitlements(*))")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function userHasEntitlement(
  userId: string,
  entitlement: string
): Promise<{ allowed: boolean; limit?: number }> {
  const sub = await getUserActiveSubscription(userId);
  if (!sub) return { allowed: false };

  const entitlements = (sub.pricing_plans as { plan_entitlements?: Array<{
    entitlement: string;
    value_int: number | null;
    value_bool: boolean | null;
  }> })?.plan_entitlements ?? [];

  const match = entitlements.find((e) => e.entitlement === entitlement);
  if (!match) return { allowed: false };

  if (match.value_bool === true) return { allowed: true };
  if (match.value_int != null) {
    const used = (sub as { sessions_used_this_period?: number }).sessions_used_this_period ?? 0;
    return { allowed: used < match.value_int, limit: match.value_int };
  }

  return { allowed: false };
}

export async function activateSubscription(input: {
  userId: string;
  planId: string;
  paymentId: string;
  periodEnd?: string;
}) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const { data, error } = await admin
    .from("member_subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      payment_id: input.paymentId,
      status: "active",
      current_period_end: input.periodEnd ?? null,
      metadata: {} as Json,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function upsertPlan(input: {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  billingInterval: string;
  priceNgn: number;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
}) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const row = {
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    billing_interval: input.billingInterval,
    price_ngn: input.priceNgn,
    is_active: input.isActive,
    is_public: input.isPublic,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await admin.from("pricing_plans").update(row).eq("id", input.id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await admin.from("pricing_plans").insert(row).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setPlanEntitlement(input: {
  planId: string;
  entitlement: string;
  valueInt?: number | null;
  valueBool?: boolean | null;
}) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Admin client required");

  const { error } = await admin.from("plan_entitlements").upsert({
    plan_id: input.planId,
    entitlement: input.entitlement,
    value_int: input.valueInt ?? null,
    value_bool: input.valueBool ?? null,
  });

  if (error) throw new Error(error.message);
}
