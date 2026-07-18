import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { shouldUseMockData, getMockAnalyticsForAdmin } from "@/lib/mock";

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdminAccess("analytics");

  const events = shouldUseMockData()
    ? getMockAnalyticsForAdmin()
    : ((
        await supabase
          .from("analytics_events")
          .select("event_name, event_category, page_path, created_at")
          .order("created_at", { ascending: false })
          .limit(30)
      ).data ?? []);

  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.event_name] = (acc[event.event_name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Analytics</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Recent interaction events from `analytics_events`.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Object.entries(counts).map(([name, count]) => (
            <div key={name} className="rounded-xl border bg-white p-4">
              <p className="text-xs text-neutral-500">{name}</p>
              <p className="text-2xl font-semibold">{count}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          {events.map((event, index) => (
            <div key={`${event.event_name}-${index}`} className="rounded-xl border bg-white p-4 text-sm">
              <p className="font-medium">{event.event_name}</p>
              <p className="mt-1 text-neutral-500">
                {event.event_category} · {event.page_path ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
