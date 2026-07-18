import Link from "next/link";
import { redirect } from "next/navigation";
import { SydefLogo } from "@/components/brand/sydef-logo";
import { PreferenceForm } from "@/components/scheduling/preference-form";
import { createClient } from "@/lib/supabase/server";
import { getUserClusters } from "@/lib/services/scheduling";
import { CLUSTER_STATUS_LABELS } from "@/lib/constants/scheduling";
import { shouldUseMockData, MOCK_LOCATIONS, MOCK_CLASSES } from "@/lib/mock";

export default async function PortalPreferencesPage() {
  if (shouldUseMockData()) {
    const locations = MOCK_LOCATIONS.map((l) => ({
      id: l.id,
      city: l.city,
      state: l.state,
      venue_name: l.venue_name,
    }));
    const classOptions = MOCK_CLASSES.filter((c) => c.is_published).map((c) => ({
      id: c.id,
      title: c.title,
    }));

    return (
      <PortalShell>
        <PreferenceForm locations={locations} classOptions={classOptions} />
        <MockClusterStatus />
      </PortalShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/portal/preferences");

  const [{ data: locations }, { data: classes }, clusters] = await Promise.all([
    supabase.from("locations").select("id, city, state, venue_name").eq("is_active", true),
    supabase.from("classes").select("id, title").eq("is_published", true),
    getUserClusters(user.id),
  ]);

  return (
    <PortalShell>
      <PreferenceForm
        locations={locations ?? []}
        classOptions={(classes ?? []).map((c) => ({ id: c.id, title: c.title }))}
      />

      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Your demand clusters</h2>
        <div className="mt-4 space-y-3">
          {clusters.length === 0 && (
            <p className="text-sm text-neutral-500">No active clusters yet — submit preferences above.</p>
          )}
          {clusters.map((cm: Record<string, unknown>) => {
            const cluster = cm.demand_clusters as Record<string, unknown> | null;
            if (!cluster) return null;
            const loc = cluster.locations as { city?: string; state?: string } | null;
            return (
              <div key={String(cm.id)} className="rounded-xl border p-4 text-sm">
                <p className="font-medium">
                  {loc?.city}, {loc?.state} · {CLUSTER_STATUS_LABELS[String(cluster.status)] ?? cluster.status}
                </p>
                <p className="mt-1 text-neutral-600">
                  {String(cluster.member_count)}/{String(cluster.min_size)} members matched
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </PortalShell>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/portal">
            <SydefLogo size="sm" />
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/portal">Portal</Link>
            <Link href="/portal/plans">Plans</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}

function MockClusterStatus() {
  return (
    <section className="mt-8 rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold">Your demand clusters</h2>
      <div className="mt-4 rounded-xl border p-4 text-sm">
        <p className="font-medium">Ikeja, Lagos · Gathering interest</p>
        <p className="mt-1 text-neutral-600">5/8 members matched</p>
      </div>
    </section>
  );
}
