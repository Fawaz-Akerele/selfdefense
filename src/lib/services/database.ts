import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { PlatformSettings } from "@/types/database";
import { shouldUseMockData, getMockPlatformSettings } from "@/lib/mock";
import { isSupabaseConfigured } from "@/lib/env";

export type DbHealth = {
  connected: boolean;
  latencyMs: number | null;
  error: string | null;
};

export async function checkDatabaseHealth(): Promise<DbHealth> {
  if (shouldUseMockData() && !isSupabaseConfigured()) {
    return { connected: true, latencyMs: 1, error: null };
  }

  const start = performance.now();

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("platform_settings").select("id").limit(1);

    if (error) {
      return {
        connected: false,
        latencyMs: Math.round(performance.now() - start),
        error: error.message,
      };
    }

    return {
      connected: true,
      latencyMs: Math.round(performance.now() - start),
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  if (shouldUseMockData()) return getMockPlatformSettings();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function logHealthCheck(
  service: string,
  status: string,
  latencyMs: number | null,
  details: Record<string, unknown> = {}
) {
  const admin = tryCreateAdminClient();
  if (!admin) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("health_checks") as any).insert({
      service,
      status,
      latency_ms: latencyMs,
      details,
    });
  } catch {
    // Health logging is non-critical
  }
}
