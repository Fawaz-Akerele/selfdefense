import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { shouldUseMockData, getMockBookingsForAdmin } from "@/lib/mock";

export default async function AdminBookingsPage() {
  const { supabase } = await requireAdminAccess("bookings");

  if (shouldUseMockData()) {
    const bookings = getMockBookingsForAdmin();
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/admin" className="text-sm text-neutral-500">
            ← Admin
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Bookings</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Recent bookings and enrollments.
          </p>
          <div className="mt-8 space-y-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border bg-white p-4 text-sm">
                <p className="font-medium">{booking.classTitle}</p>
                <p className="mt-1 text-neutral-500">
                  {booking.profile.full_name ?? booking.profile.phone} ·{" "}
                  <span className="capitalize">{booking.status}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, created_at, user_id, class_id")
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = bookings ?? [];
  const userIds = [...new Set(rows.map((b) => b.user_id))];
  const classIds = [...new Set(rows.map((b) => b.class_id))];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [] };

  const { data: classes } = classIds.length
    ? await supabase.from("classes").select("id, title").in("id", classIds)
    : { data: [] };

  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null; phone: string | null }[]).map(
      (p) => [p.id, p]
    )
  );
  const classMap = new Map(
    ((classes ?? []) as { id: string; title: string }[]).map((c) => [c.id, c])
  );

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Bookings</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Recent bookings and enrollments.
        </p>

        <div className="mt-8 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-neutral-500">No bookings yet.</p>
          ) : (
            rows.map((booking) => {
              const profile = profileMap.get(booking.user_id);
              const classRow = classMap.get(booking.class_id);
              return (
                <div key={booking.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{classRow?.title ?? "Class"}</p>
                  <p className="mt-1 text-neutral-500">
                    {profile?.full_name ?? profile?.phone ?? "Member"} ·{" "}
                    <span className="capitalize">{booking.status}</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
