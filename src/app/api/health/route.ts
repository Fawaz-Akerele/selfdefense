import { NextResponse } from "next/server";
import { checkDatabaseHealth, logHealthCheck } from "@/lib/services/database";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return NextResponse.json(
      {
        status: "degraded",
        recovery: true,
        services: {
          supabase: {
            configured: false,
            connected: false,
            error: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  const dbHealth = await checkDatabaseHealth();

  await logHealthCheck(
    "supabase",
    dbHealth.connected ? "healthy" : "unhealthy",
    dbHealth.latencyMs,
    { error: dbHealth.error }
  );

  const status = dbHealth.connected ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status,
      recovery: !dbHealth.connected,
      services: {
        supabase: {
          configured: true,
          connected: dbHealth.connected,
          latencyMs: dbHealth.latencyMs,
          error: dbHealth.error,
        },
      },
      timestamp: new Date().toISOString(),
    },
    { status: dbHealth.connected ? 200 : 503 }
  );
}
